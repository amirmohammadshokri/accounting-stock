using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Orders.Commands.Create;
using Accounting.Application.Orders.Commands.Update;
using Accounting.Application.Orders.Commands.Delete;
using Accounting.Application.Orders.Commands.Approve;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Xunit;

namespace Accounting.Tests;

public class OrderTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly Mock<IStockService> _stockServiceMock;
    private readonly AppDbContext _db;

    public OrderTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(x => x.BranchId).Returns(1);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(1);

        _stockServiceMock = new Mock<IStockService>();
        _stockServiceMock.Setup(x => x.ValidateStockAvailabilityAsync(It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _stockServiceMock.Setup(x => x.ValidateBatchStockAvailabilityAsync(It.IsAny<Dictionary<int, decimal>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var audit = new AuditSaveChangesInterceptor(_currentUserServiceMock.Object);
        _db = new AppDbContext(options, audit, _currentUserServiceMock.Object);
        UnitTestSeed.Ensure(_db);

        SeedData();
    }

    private void SeedData()
    {
        _db.Branches.Add(new Branch { Id = 1, Name = "Main", Code = "B1" });
        _db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Customer A", Code = "C001", IsCustomer = true, RowVersion = Array.Empty<byte>() });
        _db.Items.Add(new Item { Id = 1, Name = "Item A", Code = "ITM1", UnitId = 1 });
        
        // Seed an existing order for Update/Delete tests
        _db.Orders.Add(new Order
        {
            Id = 1,
            BranchId = 1,
            ContactId = 1,
            OrderNumber = "ORD001",
            Type = InvoiceType.Sales,
            Status = OrderStatus.Draft,
            DateUtc = DateTime.UtcNow,
            RowVersion = Array.Empty<byte>(),
            Lines = new List<OrderLine> 
            {
                new OrderLine { Id = 1, ItemId = 1, Description = "Test Item", Quantity = 10, UnitPrice = 100, Total = 1000 }
            }
        });

        _db.SaveChanges();
    }

    [Fact]
    public async Task CreateOrder_ShouldSucceed()
    {
        var handler = new CreateOrderHandler(_db, _currentUserServiceMock.Object);
        var command = new CreateOrderCommand(
            ContactId: 1,
            DateUtc: DateTime.UtcNow,
            Type: InvoiceType.Sales,
            Currency: "IRR",
            Description: "New Order",
            Lines: new List<CreateOrderLineDto>
            {
                new CreateOrderLineDto(1, "Item A", 5.00m, 100.00m, 18)
            }
        );

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("1", result.ContactId.ToString()); // ContactId is int, checking prop
        Assert.Equal(590, result.TotalGross); // 5 * 100 = 500 Net, +18% VAT = 590
    }

    /// <summary>
    /// Regression test for a real bug found via manual API testing: CreateOrderHandler
    /// picked "the last order" by sorting the whole (branch, type) set by the raw
    /// OrderNumber string descending, then tried to long.TryParse it. DataSeeder seeds
    /// orders as "SO-2026-0001"/"PO-2026-0001", which both sorts ahead of a bare "000001"
    /// (lexicographically, 'S'/'P' > '0') and fails to parse as a number — so the
    /// generator silently fell back to nextNum=1 on every single call, meaning the second
    /// real order for a given branch+type always tried to reuse the same OrderNumber as
    /// the first and hit the unique index in real SQL Server (a 500 on the API).
    /// </summary>
    [Fact]
    public async Task CreateOrder_TwiceForSameBranchAndType_ShouldNotReuseOrderNumber()
    {
        // Seed data (DataSeeder) always has at least one order per branch/type in this
        // "SO-{year}-NNNN" family — reproduce that here.
        var year = DateTime.UtcNow.Year;
        _db.Orders.Add(new Order
        {
            BranchId = 1,
            ContactId = 1,
            OrderNumber = $"SO-{year}-0001",
            Type = InvoiceType.Sales,
            Status = OrderStatus.Draft,
            DateUtc = DateTime.UtcNow,
            RowVersion = Array.Empty<byte>()
        });
        await _db.SaveChangesAsync();

        var handler = new CreateOrderHandler(_db, _currentUserServiceMock.Object);
        var command = new CreateOrderCommand(
            ContactId: 1,
            DateUtc: DateTime.UtcNow,
            Type: InvoiceType.Sales,
            Currency: "IRR",
            Description: "Real order 1",
            Lines: new List<CreateOrderLineDto> { new CreateOrderLineDto(1, "Item A", 1m, 100m, 0) }
        );

        var first = await handler.Handle(command, CancellationToken.None);
        var second = await handler.Handle(command with { Description = "Real order 2" }, CancellationToken.None);

        Assert.NotEqual(first.OrderNumber, second.OrderNumber);
        Assert.Equal($"SO-{year}-0002", first.OrderNumber);
        Assert.Equal($"SO-{year}-0003", second.OrderNumber);
    }

    [Fact]
    public async Task UpdateOrder_ShouldSucceed()
    {
        var handler = new UpdateOrderHandler(_db, _currentUserServiceMock.Object);
        
        // Fetch row version
        var existingOrder = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1);
        var rowVersion = Convert.ToBase64String(existingOrder!.RowVersion);

        var command = new UpdateOrderCommand(
            Id: 1,
            ContactId: 1,
            DateUtc: DateTime.UtcNow,
            Description: "Updated Order",
            Lines: new List<UpdateOrderLineDto>
            {
                new UpdateOrderLineDto(1, 1, "Item A", 20.000m, 100.0000m, 20)
            },
            RowVersion: rowVersion
        );

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        
        var updatedOrder = await _db.Orders.Include(o => o.Lines).FirstOrDefaultAsync(o => o.Id == 1);
        Assert.Equal(20, updatedOrder!.Lines.First().Quantity);
        Assert.Equal(2400, updatedOrder.TotalGross); // 20 * 100 * 1.20
    }

    [Fact]
    public async Task DeleteOrder_ShouldSoftDelete()
    {
        var handler = new DeleteOrderHandler(_db, _currentUserServiceMock.Object);
        
        var existingOrder = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1);
        var rowVersion = Convert.ToBase64String(existingOrder!.RowVersion);

        var command = new DeleteOrderCommand(1, rowVersion); // Fixed: added RowVersion

        await handler.Handle(command, CancellationToken.None);

        var deletedOrder = await _db.Orders.IgnoreQueryFilters().FirstOrDefaultAsync(o => o.Id == 1);
        Assert.True(deletedOrder!.IsDeleted);
    }
    
    [Fact]
    public async Task ApproveOrder_ShouldChangeStatus()
    {
        var handler = new ApproveOrderHandler(_db, _stockServiceMock.Object, _currentUserServiceMock.Object);
        
        var existingOrder = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1);
        
        var command = new ApproveOrderCommand(1, existingOrder!.RowVersion); // Fixed: RowVersion is byte[]

        await handler.Handle(command, CancellationToken.None);

        var order = await _db.Orders.FindAsync(1);
        Assert.Equal(OrderStatus.Approved, order!.Status);

        // ApproveOrderHandler now validates stock in one batched call instead of per-line.
        _stockServiceMock.Verify(
            x => x.ValidateBatchStockAvailabilityAsync(
                It.Is<Dictionary<int, decimal>>(d => d.Count == 1 && d[1] == 10),
                It.IsAny<CancellationToken>()),
            Times.Once);
        _stockServiceMock.Verify(
            x => x.ValidateStockAvailabilityAsync(It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
