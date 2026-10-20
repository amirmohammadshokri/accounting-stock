using Accounting.Application.Common.Interfaces;
using Accounting.Application.Orders.Commands.CreateInvoice;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Xunit;

namespace Accounting.Tests;

/// <summary>
/// Regression coverage for a real bug found via manual API testing: converting an
/// approved order to an invoice produced an invoice where every line's Gross field
/// actually held Net+Vat (the value that belongs in GrandTotal), GrandTotal itself was
/// never set (stuck at 0), and the invoice header's TotalLineGross was never set either.
/// No test previously exercised CreateInvoiceFromOrderHandler at all.
/// </summary>
public class OrderToInvoiceConversionTests
{
    [Fact]
    public async Task CreateInvoiceFromOrder_ShouldProduceCorrectLineAndHeaderTotals()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        var userService = new Mock<ICurrentUserService>();
        userService.Setup(x => x.BranchId).Returns(1);
        userService.Setup(x => x.UserId).Returns(1);

        var audit = new AuditSaveChangesInterceptor(userService.Object);
        using var db = new AppDbContext(options, audit, userService.Object);
        UnitTestSeed.Ensure(db);

        db.Branches.Add(new Branch { Id = 1, Name = "Main", Code = "BR-01" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Name = "Customer", Code = "C-01", IsCustomer = true });
        db.Items.Add(new Item { Id = 1, Name = "Item A", Code = "I-01", UnitId = 1, Type = ItemType.Inventory });
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Code = "WH-01", Name = "Main", IsDefault = true, RowVersion = [] });
        db.Stocks.Add(new Stock { BranchId = 1, WarehouseId = 1, ItemId = 1, Quantity = 10m, RowVersion = [] });

        var order = new Order
        {
            Id = 1,
            BranchId = 1,
            ContactId = 1,
            OrderNumber = "ORD-001",
            Type = InvoiceType.Sales,
            Status = OrderStatus.Approved,
            DateUtc = DateTime.UtcNow,
            RowVersion = [],
            Lines =
            {
                new OrderLine { ItemId = 1, Description = "Item A", Quantity = 2, UnitPrice = 100m, VatRate = 20, Total = 200m }
            }
        };
        db.Orders.Add(order);

        await db.SaveChangesAsync();

        var handler = new CreateInvoiceFromOrderHandler(db, userService.Object);
        var invoiceId = await handler.Handle(new CreateInvoiceFromOrderCommand(order.Id), CancellationToken.None);

        var invoice = await db.Invoices.Include(i => i.Lines).FirstAsync(i => i.Id == invoiceId);
        var line = Assert.Single(invoice.Lines);

        // Qty(2) * UnitPrice(100) = 200 gross, no discount so Net is also 200,
        // Vat = 20% of 200 = 40, GrandTotal = Net + Vat = 240.
        Assert.Equal(200m, line.Gross);
        Assert.Equal(200m, line.Net);
        Assert.Equal(40m, line.Vat);
        Assert.Equal(240m, line.GrandTotal);

        Assert.Equal(200m, invoice.TotalLineGross);
        Assert.Equal(200m, invoice.TotalNet);
        Assert.Equal(40m, invoice.TotalVat);
        Assert.Equal(240m, invoice.TotalGross);

        // Stock should have decreased by the sold quantity (10 -> 8), via a real
        // SalesOut StockMovement, not left untouched or driven negative unchecked.
        var stock = await db.Stocks.FirstAsync(s => s.ItemId == 1 && s.WarehouseId == 1);
        Assert.Equal(8m, stock.Quantity);

        var movement = await db.StockMovements.FirstAsync(m => m.InvoiceId == invoiceId);
        Assert.Equal(StockMovementType.SalesOut, movement.Type);
        Assert.Equal(2m, movement.Quantity);
    }
}
