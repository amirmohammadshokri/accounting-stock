using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Items.Queries.List;
using Accounting.Application.Invoices.Commands.Create;
using Accounting.Application.Invoices.Commands.Update;
using Accounting.Application.Invoices.Queries.List;
using Accounting.Application.Orders.Commands.Create;
using Accounting.Application.Orders.Commands.Update;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Tests;
public class SalesWorkflowTests
{
    private record Filters(string? Json):IListFilterContext;
    private static AppDbContext Open(FakeCurrentUserService user,bool sql=false)=>new(
        sql?new DbContextOptionsBuilder<AppDbContext>().UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=OfflineFilterSql;Trusted_Connection=True").Options:
        new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new AuditSaveChangesInterceptor(user),user);

    [Fact]
    public async Task Filters_RunBeforePagingAndTotals_AndRespectBranchScope()
    {
        var user=new FakeCurrentUserService(1);using var db=Open(user);UnitTestSeed.Ensure(db);
        for(var i=1;i<=40;i++)db.Items.Add(new Item{Id=i,Code=$"I{i:D3}",Name=$"Item {i:D3}",UnitId=1,Type=ItemType.Inventory,SalesPrice=i*100});
        db.Branches.AddRange(new Branch{Id=1,Code="A",Name="A"},new Branch{Id=2,Code="B",Name="B"});
        db.Contacts.AddRange(new Contact{Id=1,BranchId=1,Code="C1",Name="Local"},new Contact{Id=2,BranchId=2,Code="C2",Name="Other"});
        db.Invoices.AddRange(new Invoice{Id=1,BranchId=1,ContactId=1,InvoiceNumber="A1",DateUtc=DateTime.UtcNow,Type=InvoiceType.Sales,Currency="IRR",TotalNet=700,TotalGross=700},
            new Invoice{Id=2,BranchId=2,ContactId=2,InvoiceNumber="B2",DateUtc=DateTime.UtcNow,Type=InvoiceType.Sales,Currency="IRR",TotalNet=900,TotalGross=900});
        await db.SaveChangesAsync();
        var items=await new ListItemsHandler(db,user,new Filters("{\"salesPrice\":{\"op\":\"greater\",\"value\":\"۳۰۰۰\"}}")).Handle(new(PageSize:3),default);
        Assert.Equal(10,items.Total);Assert.Equal(3,items.Items.Count);Assert.All(items.Items,x=>Assert.True(x.SalesPrice>3000));
        var invoices=await new ListInvoicesHandler(db,user,new Filters("{\"totalGross\":{\"op\":\"greater\",\"value\":\"۵۰۰\"}}")).Handle(new(),default);
        Assert.Equal(1,invoices.Total);Assert.Equal(1,Assert.Single(invoices.Items).Id);
    }
    [Fact]
    public void Filters_TranslateToSqlWithoutAConnection_AndRejectPrivateFields()
    {
        using var db=Open(new FakeCurrentUserService(1),true);
        var sql=db.Invoices.ApplyListFilters("{\"dateUtc\":{\"op\":\"equal\",\"value\":\"۱۴۰۵/۰۱/۰۱\"},\"contactName\":{\"op\":\"contains\",\"value\":\"علی\"}}").ToQueryString();
        Assert.Contains("WHERE",sql);Assert.Contains("2026-03-21",sql);Assert.Contains("Name",sql);
        Assert.Contains("FirstName",db.Users.ApplyListFilters("{\"fullName\":{\"op\":\"contains\",\"value\":\"سارا\"}}").ToQueryString());
        Assert.Throws<BusinessRuleException>(()=>db.Users.ApplyListFilters("{\"passwordHash\":{\"op\":\"contains\",\"value\":\"x\"}}"));
        Assert.Throws<BusinessRuleException>(()=>db.Items.ApplyListFilters("{\"salesPrice\":{\"op\":\"greater\",\"value\":\"not a number\"}}"));
    }
    [Fact]
    public async Task DuplicateItems_AreRejectedOnCreateAndUpdateForInvoicesAndOrders()
    {
        var user=new FakeCurrentUserService(1);using var db=Open(user);UnitTestSeed.Ensure(db);
        db.Branches.Add(new Branch{Id=1,Code="B",Name="B"});db.Contacts.Add(new Contact{Id=1,BranchId=1,Code="C",Name="C"});
        db.Items.Add(new Item{Id=1,Code="I",Name="I",UnitId=1,Type=ItemType.Service});await db.SaveChangesAsync();
        var invoice=new CreateInvoiceCommand(1,DateTime.UtcNow,"IRR",new(){new(1,1,100,0,null,null),new(1,2,100,0,null,null)},InvoiceType.Sales,null,null,null,null);
        var created=await new CreateInvoiceValidator(db,user).ValidateAsync(invoice);
        Assert.Contains(created.Errors,e=>e.ErrorMessage.Contains("هر کالا فقط یک ردیف"));
        var updated=await new UpdateInvoiceValidator(db,user).ValidateAsync(new UpdateInvoiceCommand(1,DateTime.UtcNow,"IRR",1,InvoiceType.Sales,null,null,null,null,new List<UpdateInvoiceLineDto>{new(1,1,1,100,0,null,null),new(2,1,1,100,0,null,null)},"AAAAAAAAAAA="));
        Assert.Contains(updated.Errors,e=>e.ErrorMessage.Contains("هر کالا فقط یک ردیف"));
        var order=new CreateOrderCommand(1,DateTime.UtcNow,InvoiceType.Sales,"IRR",null,new(){new(1,"غذا",1,100,0),new(1,"غذا",2,100,0)});
        Assert.Contains((await new CreateOrderValidator(db,user).ValidateAsync(order)).Errors,e=>e.ErrorMessage.Contains("هر کالا فقط یک ردیف"));
        Assert.Contains((await new UpdateOrderValidator(db).ValidateAsync(new UpdateOrderCommand(1,1,DateTime.UtcNow,null,new(){new(1,1,"غذا",1,100,0),new(2,1,"غذا",2,100,0)},"AAAAAAAAAAA="))).Errors,e=>e.ErrorMessage.Contains("هر کالا فقط یک ردیف"));
    }
    private static void AssertSql<T>(IQueryable<T> query,params string[] fields)
    {
        foreach(var field in fields)Assert.Contains("WHERE",query.ApplyListFilters(System.Text.Json.JsonSerializer.Serialize(new Dictionary<string,object>{{field,new {op="notBlank",value=""}}})).ToQueryString());
    }
    [Fact]
    public void FilterAliases_AllTranslateWithoutExecutingSql()
    {
        using var db=Open(new FakeCurrentUserService(1),true);
        AssertSql(db.Items,"categoryName","unitName","purchasePrice","salesPrice","vatRate");
        AssertSql(db.Stocks,"warehouseCode","unit","qty","itemName");
        AssertSql(db.StockMovements,"date","item","qty","type","note");
        AssertSql(db.Cheques,"chequeNumber","issueDate","dueDate","drawerName","bankName");
        AssertSql(db.CashBankAccounts,"balance","iban");
        AssertSql(db.Orders,"orderNumber","contactName");
        AssertSql(db.Users,"fullName","status","branchName");
        AssertSql(db.Contacts,"subscriptionNumber","contactRole");
        var auto=db.Contacts.ApplyListFilters("{\"subscriptionNumber\":{\"op\":\"startsWith\",\"value\":\"AUTO-\"}}").ToQueryString();
        Assert.Contains("SUBSTRING",auto,StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void QuantityFilter_MatchesTheSignedMovementShownToTheUser()
    {
        var rows=new[]{new StockMovement{Id=1,Type=StockMovementType.TransferIn,Quantity=5},new StockMovement{Id=2,Type=StockMovementType.SalesOut,Quantity=3}}.AsQueryable();
        Assert.Equal(2,Assert.Single(rows.ApplyListFilters("{\"qty\":{\"op\":\"less\",\"value\":\"0\"}}")).Id);
    }

}
