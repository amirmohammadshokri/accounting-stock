using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Invoices.Commands.Create;
using Accounting.Application.Invoices.Commands.Update;
using Accounting.Application.Invoices.Queries.GetById;
using Accounting.Application.Invoices.Queries.List;
using Accounting.Application.Invoices.Queries.Dto;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Accounting.Tests;

public class InvoicesTests
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Mock<IStockService> _stockServiceMock;
    private readonly Mock<IInvoiceNumberService> _invoiceNumberServiceMock;
    private readonly Mock<IInvoiceBalanceService> _balanceServiceMock;

    public InvoicesTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _stockServiceMock = new Mock<IStockService>();
        _invoiceNumberServiceMock = new Mock<IInvoiceNumberService>();
        _balanceServiceMock = new Mock<IInvoiceBalanceService>();
    }

    [Fact]
    public async Task CreateInvoice_ShouldSucceed_WhenValidData()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);
        UnitTestSeed.Ensure(db);

        // Seed
        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Test Customer", Code = "C-01", IsCustomer = true });
        db.Items.Add(new Item { Id = 10, Name = "Item A", Code = "I-01", UnitId = 1, VatRate = 20, SalesPrice = 100m });
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Name = "Main Warehouse", Code = "WH-01", IsDefault = true, RowVersion = Array.Empty<byte>() });
        // Item defaults to ItemType.Inventory, so the Sales invoice line below creates a real
        // stock movement (CreateInvoiceHandler now applies it directly, not through a mocked
        // mediator) — needs enough stock on hand or it correctly fails with "Yetersiz stok".
        db.Stocks.Add(new Stock { BranchId = 1, WarehouseId = 1, ItemId = 10, Quantity = 100m, RowVersion = Array.Empty<byte>() });
        await db.SaveChangesAsync();

        // Mocks
        _invoiceNumberServiceMock
            .Setup(x => x.GenerateNextAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("INV-2023-001");

        _stockServiceMock
            .Setup(x => x.ValidateBatchStockAvailabilityAsync(It.IsAny<Dictionary<int, decimal>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = new CreateInvoiceHandler(db, _stockServiceMock.Object, userService, _invoiceNumberServiceMock.Object);

        var command = new CreateInvoiceCommand(
            ContactId: 1,
            DateUtc: DateTime.UtcNow,
            Currency: "IRR",
            Type: InvoiceType.Sales,
            DocumentType: DocumentType.Invoice,
            WaybillNumber: null,
            WaybillDateUtc: null,
            PaymentDueDateUtc: DateTime.UtcNow.AddDays(7),
            Lines: new List<CreateInvoiceLineDto>
            {
                new CreateInvoiceLineDto(10, 1.00m, 100.00m, 20, 0.00m, 0)
            }
        );

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(0, result.Id);
        var invoice = await db.Invoices.Include(i => i.Lines).FirstOrDefaultAsync(i => i.Id == result.Id);
        Assert.NotNull(invoice);
        Assert.Equal("INV-2023-001", invoice.InvoiceNumber);
        Assert.Single(invoice.Lines);
        Assert.Equal(100m, invoice.TotalLineGross);
        Assert.Equal(20m, invoice.TotalVat);
        Assert.Equal(120m, invoice.TotalGross);
    }

    [Fact]
    public async Task UpdateInvoice_ShouldSucceed()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);
        UnitTestSeed.Ensure(db);

        // Seed
        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Test Customer", Code = "C-01", IsCustomer = true });
        db.Items.Add(new Item { Id = 10, Name = "Item A", Code = "I-01", UnitId = 1, VatRate = 20, SalesPrice = 100m });
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Name = "Main Warehouse", Code = "WH-01", IsDefault = true, RowVersion = Array.Empty<byte>() });
        // Item defaults to ItemType.Inventory, and the Sales line below now really applies
        // a stock movement (SyncStockMovements no longer routes through a mocked mediator).
        db.Stocks.Add(new Stock { BranchId = 1, WarehouseId = 1, ItemId = 10, Quantity = 100m, RowVersion = Array.Empty<byte>() });

        var invoice = new Invoice
        {
            BranchId = 1,
            ContactId = 1,
            InvoiceNumber = "INV-001",
            DateUtc = DateTime.UtcNow,
            Type = InvoiceType.Sales,
            RowVersion = Array.Empty<byte>()
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        var handler = new UpdateInvoiceHandler(db, _balanceServiceMock.Object, userService);

        var command = new UpdateInvoiceCommand(
            Id: invoice.Id,
            RowVersionBase64: Convert.ToBase64String(invoice.RowVersion),
            DateUtc: DateTime.UtcNow,
            Currency: "IRR",
            ContactId: 1,
            Type: InvoiceType.Sales,
            DocumentType: DocumentType.Invoice,
            WaybillNumber: null,
            WaybillDateUtc: null,
            PaymentDueDateUtc: null,
            Lines: new List<UpdateInvoiceLineDto>
            {
                // New Line
                new UpdateInvoiceLineDto(0, 10, 2.00m, 100.00m, 20, 0.00m, 0) 
            }
        );

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(1, result.Lines.Count); // use Lines instead of Items
        Assert.Equal(200.00m, result.TotalLineGross); // 2 * 100
    }

    /// <summary>
    /// Regression test for a real bug found via manual UI testing: editing an invoice's
    /// line quantity applied the new stock movement on top of the old one instead of
    /// replacing it, because SyncStockMovements soft-deleted the old StockMovement records
    /// without ever reversing their effect on Stock.Quantity. Creating a Sales invoice for
    /// qty 5 then editing it down to qty 3 used to leave the stock short by 8, not 3.
    /// </summary>
    [Fact]
    public async Task UpdateInvoice_ChangingLineQuantity_ShouldNetAdjustStock_NotStack()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);
        UnitTestSeed.Ensure(db);

        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Test Customer", Code = "C-01", IsCustomer = true });
        db.Items.Add(new Item { Id = 10, Name = "Item A", Code = "I-01", UnitId = 1, VatRate = 20, SalesPrice = 100m });
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Name = "Main Warehouse", Code = "WH-01", IsDefault = true, RowVersion = Array.Empty<byte>() });
        db.Stocks.Add(new Stock { BranchId = 1, WarehouseId = 1, ItemId = 10, Quantity = 100m, RowVersion = Array.Empty<byte>() });
        await db.SaveChangesAsync();

        _invoiceNumberServiceMock
            .Setup(x => x.GenerateNextAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("INV-STOCK-001");
        _stockServiceMock
            .Setup(x => x.ValidateBatchStockAvailabilityAsync(It.IsAny<Dictionary<int, decimal>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var createHandler = new CreateInvoiceHandler(db, _stockServiceMock.Object, userService, _invoiceNumberServiceMock.Object);
        var created = await createHandler.Handle(new CreateInvoiceCommand(
            ContactId: 1,
            DateUtc: DateTime.UtcNow,
            Currency: "IRR",
            Type: InvoiceType.Sales,
            DocumentType: DocumentType.Invoice,
            WaybillNumber: null,
            WaybillDateUtc: null,
            PaymentDueDateUtc: null,
            Lines: new List<CreateInvoiceLineDto> { new CreateInvoiceLineDto(10, 5.00m, 100.00m, 20, 0.00m, 0) }
        ), CancellationToken.None);

        var stockAfterCreate = await db.Stocks.AsNoTracking().FirstAsync(s => s.ItemId == 10);
        Assert.Equal(95m, stockAfterCreate.Quantity); // 100 - 5

        var invoiceAfterCreate = await db.Invoices.Include(i => i.Lines).FirstAsync(i => i.Id == created.Id);
        var lineId = invoiceAfterCreate.Lines.Single().Id;

        var updateHandler = new UpdateInvoiceHandler(db, _balanceServiceMock.Object, userService);
        await updateHandler.Handle(new UpdateInvoiceCommand(
            Id: created.Id,
            RowVersionBase64: Convert.ToBase64String(invoiceAfterCreate.RowVersion),
            DateUtc: invoiceAfterCreate.DateUtc,
            Currency: "IRR",
            ContactId: 1,
            Type: InvoiceType.Sales,
            DocumentType: DocumentType.Invoice,
            WaybillNumber: null,
            WaybillDateUtc: null,
            PaymentDueDateUtc: null,
            Lines: new List<UpdateInvoiceLineDto> { new UpdateInvoiceLineDto(lineId, 10, 3.00m, 100.00m, 20, 0.00m, 0) }
        ), CancellationToken.None);

        var stockAfterUpdate = await db.Stocks.AsNoTracking().FirstAsync(s => s.ItemId == 10);
        // Net effect of the invoice should now be -3 from the original 100, i.e. 97 —
        // not 100 - 5 - 3 = 92, which is what the bug produced.
        Assert.Equal(97m, stockAfterUpdate.Quantity);
    }

    [Fact]
    public async Task GetInvoiceById_ShouldReturnInvoice()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);
        UnitTestSeed.Ensure(db);

        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Customer", Code = "C-01" });
        
        var invoice = new Invoice
        {
            BranchId = 1,
            ContactId = 1,
            InvoiceNumber = "INV-GET-01",
            RowVersion = Array.Empty<byte>()
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        var handler = new GetInvoiceByIdHandler(db, userService);
        var result = await handler.Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("INV-GET-01", result.InvoiceNumber);
    }

    [Fact]
    public async Task ListInvoices_ShouldReturnPagedResults()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);
        UnitTestSeed.Ensure(db);

        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Customer", Code = "C-01" });

        for (int i = 0; i < 3; i++)
        {
            db.Invoices.Add(new Invoice
            {
                BranchId = 1,
                ContactId = 1,
                InvoiceNumber = $"INV-{i}",
                DateUtc = DateTime.UtcNow,
                RowVersion = Array.Empty<byte>()
            });
        }
        await db.SaveChangesAsync();

        var handler = new ListInvoicesHandler(db, userService);
        var result = await handler.Handle(new ListInvoicesQuery(PageSize: 10), CancellationToken.None);

        Assert.Equal(3, result.Total);
    }
}
