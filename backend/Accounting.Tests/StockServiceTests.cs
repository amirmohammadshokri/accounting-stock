using Accounting.Application.Common.Interfaces;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Accounting.Tests;

public class StockServiceTests
{
    private readonly DbContextOptions<AppDbContext> _options;

    public StockServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task GetItemStockAsync_ShouldCalculateCorrectly()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);

        // Seed
        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Contact", Code = "C-01" });
        db.Items.Add(new Item { Id = 10, Name = "Item A", Code = "I-01" });
        
        // Purchase Invoice (In)
        var inv1 = new Invoice
        {
            BranchId = 1, ContactId = 1, InvoiceNumber = "INV-01", DateUtc = DateTime.UtcNow,
            Type = InvoiceType.Purchase, RowVersion = Array.Empty<byte>()
        };
        inv1.Lines.Add(new InvoiceLine { ItemId = 10, ItemCode = "I-01", ItemName = "Item A", Unit="adet", Qty = 10, Net = 100, Gross = 120 });
        db.Invoices.Add(inv1);

        // Sales Invoice (Out)
        var inv2 = new Invoice
        {
            BranchId = 1, ContactId = 1, InvoiceNumber = "INV-02", DateUtc = DateTime.UtcNow,
            Type = InvoiceType.Sales, RowVersion = Array.Empty<byte>()
        };
        inv2.Lines.Add(new InvoiceLine { ItemId = 10, ItemCode = "I-01", ItemName = "Item A", Unit="adet", Qty = 3, Net = 30, Gross = 36 });
        db.Invoices.Add(inv2);

        // Approved Sales Order (Reserved)
        var order = new Order
        {
            BranchId = 1, ContactId = 1, OrderNumber = "ORD-01", DateUtc = DateTime.UtcNow,
            Type = InvoiceType.Sales, Status = OrderStatus.Approved, RowVersion = Array.Empty<byte>()
        };
        order.Lines.Add(new OrderLine { ItemId = 10, Description = "Item A", Quantity = 2, UnitPrice = 10, Total = 20 });
        db.Orders.Add(order);

        // Physical on-hand snapshot (what CreateStockMovementHandler/CreateInvoiceHandler
        // actually keep in sync) — QuantityAvailable is derived from this, not from
        // re-summing invoice lines.
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Code = "WH-01", Name = "Main", IsDefault = true, RowVersion = Array.Empty<byte>() });
        db.Stocks.Add(new Stock { BranchId = 1, WarehouseId = 1, ItemId = 10, Quantity = 7, RowVersion = Array.Empty<byte>() });

        await db.SaveChangesAsync();

        var service = new StockService(db, userService);

        var stock = await service.GetItemStockAsync(10, CancellationToken.None);

        // In: 10 (informational, from invoice lines)
        // Out: 3 (informational, from invoice lines)
        // On-hand (Stock table): 7
        // Reserved: 2
        // Available: on-hand(7) - reserved(2) = 5
        Assert.Equal(10, stock.QuantityIn);
        Assert.Equal(3, stock.QuantityOut);
        Assert.Equal(2, stock.QuantityReserved);
        Assert.Equal(5, stock.QuantityAvailable);
    }

    [Fact]
    public async Task ValidateStockAvailability_AllowsInsufficientStock()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);

        // Seed only 5 items physically on hand
        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Items.Add(new Item { Id = 10, Name = "Item A", Code = "I-01" });
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Code = "WH-01", Name = "Main", IsDefault = true, RowVersion = Array.Empty<byte>() });
        db.Stocks.Add(new Stock { BranchId = 1, WarehouseId = 1, ItemId = 10, Quantity = 5, RowVersion = Array.Empty<byte>() });
        await db.SaveChangesAsync();

        var service = new StockService(db, userService);

        await service.ValidateStockAvailabilityAsync(10, 10, CancellationToken.None);
        await service.ValidateBatchStockAvailabilityAsync(new() { [10] = 100m }, CancellationToken.None);
    }

    /// <summary>
    /// Regression test for a real bug found via manual API testing: stock entered as an
    /// opening balance / adjustment (a StockMovement with no matching Purchase invoice —
    /// exactly how DataSeeder and any real "initial inventory count" workflow populates
    /// stock) was invisible to the old invoice-line-summing calculation, so
    /// ValidateStockAvailabilityAsync rejected every sale of seeded/adjusted stock even
    /// though the Stock table correctly showed plenty on hand.
    /// </summary>
    [Fact]
    public async Task ValidateStockAvailability_ShouldSucceed_ForStockWithNoPurchaseInvoice()
    {
        var userService = new FakeCurrentUserService(branchId: 1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using var db = new AppDbContext(_options, audit, userService);

        db.Branches.Add(new Branch { Id = 1, Name = "Main Branch", Code = "BR-01" });
        db.Items.Add(new Item { Id = 10, Name = "Item A", Code = "I-01" });
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Code = "WH-01", Name = "Main", IsDefault = true, RowVersion = Array.Empty<byte>() });

        // No Invoice/InvoiceLine at all — stock arrived purely as an opening-balance
        // adjustment movement, same as DataSeeder's "Açılış stoku" entries.
        db.Stocks.Add(new Stock { BranchId = 1, WarehouseId = 1, ItemId = 10, Quantity = 62m, RowVersion = Array.Empty<byte>() });
        await db.SaveChangesAsync();

        var service = new StockService(db, userService);

        // Should not throw: 62 on hand, 2 requested.
        await service.ValidateStockAvailabilityAsync(10, 2, CancellationToken.None);

        var stock = await service.GetItemStockAsync(10, CancellationToken.None);
        Assert.Equal(0, stock.QuantityIn);   // no Purchase invoice exists
        Assert.Equal(62, stock.QuantityAvailable);
    }
}
