using Accounting.Application.Common.Exceptions;
using Accounting.Application.Invoices.Commands.Create;
using Accounting.Application.Invoices.Commands.Update;
using Accounting.Application.Invoices.Queries.Print;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Infrastructure.Reporting;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Accounting.Tests;

public class CateringTests
{
    private static AppDbContext Open(FakeCurrentUserService user)
        => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options,
            new AuditSaveChangesInterceptor(user), user);
    private static async Task Seed(AppDbContext db)
    {
        UnitTestSeed.Ensure(db);
        db.Branches.Add(new Branch { Id = 1, Code = "CATERING", Name = "کترینگ" });
        db.Contacts.Add(new Contact { Id = 1, BranchId = 1, Code = "C", Name = "مشتری" });
        db.Items.Add(new Item { Id = 1, Code = "FOOD", Name = "جوجه", UnitId = 1, Type = ItemType.Inventory });
        db.Items.Add(new Item { Id = 2, Code = "SERVICE", Name = "پذیرایی", UnitId = 1, Type = ItemType.Service });
        db.Warehouses.Add(new Warehouse { Id = 1, BranchId = 1, Code = "W", Name = "انبار", IsDefault = true });
        await db.SaveChangesAsync();
    }
    [Theory]
    [InlineData(InvoiceType.Sales, -10)]
    [InlineData(InvoiceType.PurchaseReturn, -10)]
    [InlineData(InvoiceType.Purchase, 10)]
    public async Task Invoice_CreatesAndEditsWithoutStockPreconditions(InvoiceType type, int expected)
    {
        var user = new FakeCurrentUserService(1);
        using var db = Open(user); await Seed(db);
        var stock = new StockService(db, user);
        var command = new CreateInvoiceCommand(1, DateTime.UtcNow, "IRR",
            new() { new(1, 10m, 100m, 0, 0, 0) }, type, null, null, null, null) { Notes = "تحویل ساعت ۱۲" };
        var created = await new CreateInvoiceHandler(db, stock, user, new InvoiceNumberService(db)).Handle(command, default);
        Assert.Equal(expected, (await db.Stocks.SingleAsync()).Quantity);
        var invoice = await db.Invoices.SingleAsync();
        var line = await db.InvoiceLines.SingleAsync();
        await new UpdateInvoiceHandler(db, new InvoiceBalanceService(db), user).Handle(new UpdateInvoiceCommand(
            created.Id, DateTime.UtcNow, "IRR", 1, type, null, null, null, null,
            new[] { new UpdateInvoiceLineDto(line.Id, 1, 20m, 100m, 0, 0, 0) }, Convert.ToBase64String(invoice.RowVersion))
            { Notes = "ویرایش توضیحات" }, default);
        Assert.Equal(expected * 2, (await db.Stocks.SingleAsync()).Quantity);
        Assert.Equal("ویرایش توضیحات", invoice.Notes);
    }
    [Fact]
    public async Task Package_MixesFoodAndService_AndRejectsDeletedItemsAndStaleVersions()
    {
        using var db = Open(new(1)); await Seed(db);
        var service = new MealPackageService(db);
        var saved = await service.Save(null, new("ناهار", new[] {new MealPackageRow(1, 1, 100, 0),new MealPackageRow(2, 1, 20, 0)}), default);
        Assert.Equal(2, saved.Lines.Count); Assert.All(saved.Lines, l => Assert.True(l.Available));
        Assert.Equal("جوجه", saved.Lines[0].Name);
        await Assert.ThrowsAsync<ConcurrencyConflictException>(() => service.Save(saved.Id, new("تغییر", new[]{new MealPackageRow(1,1,100,0)}, "stale"), default));
        var item = await db.Items.SingleAsync(x => x.Id == 1); item.IsDeleted = true; await db.SaveChangesAsync();
        Assert.False((await service.List(default))[0].Lines[0].Available);
        await Assert.ThrowsAsync<BusinessRuleException>(() => service.Save(null, new("خراب",new[]{new MealPackageRow(1,1,100,0)}), default));
        await service.Delete(saved.Id, saved.RowVersion, default);
        Assert.Empty(await service.List(default));
    }
    [Fact]
    public void PrintData_PadsBlankRowsWithoutChangingAmountsOrEvaluatingUserText()
    {
        var party = new InvoicePrintParty("کترینگ", null, null, null, null, null);
        var line = new InvoicePrintLine(1,"F","غذا","پرس",1,100,100,0,100,0,0,100);
        var doc = new InvoicePrintDocument(1,"S-1",DateTime.UtcNow,"فاکتور",party,party,new[]{line},100,0,100,0,100,0,60,null,null) { Notes = "{Invoice.Total}" };
        using var data = InvoiceReportData.Create(doc,new InvoicePrintLayout());
        Assert.Equal(10,data.Tables["Lines"]!.Rows.Count);
        Assert.Equal("",data.Tables["Lines"]!.Rows[9]["Total"]);
        Assert.Equal("{Invoice.Total}",data.Tables["Invoice"]!.Rows[0]["Notes"]);
        Assert.Equal(PersianInvoiceText.Amount(40),data.Tables["Invoice"]!.Rows[0]["Paid"]);
    }
}
