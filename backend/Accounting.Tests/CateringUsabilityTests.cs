using Accounting.Application.Contacts.Commands.Create;
using Accounting.Application.Contacts.Commands.Update;
using Accounting.Application.Contacts.Queries.Dto;
using Accounting.Application.Contacts.Queries.List;
using Accounting.Application.Orders.Commands.Create;
using Accounting.Application.Orders.Commands.CreateInvoice;
using Accounting.Application.Orders.Commands.Update;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Accounting.Tests;
public class CateringUsabilityTests
{
    private static AppDbContext Open(FakeCurrentUserService user) => new(
        new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString())
        .ConfigureWarnings(w=>w.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options,
        new AuditSaveChangesInterceptor(user),user);

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PersonOrCompany_CanBeCreatedWithoutOptionalOfficialIdentity(bool company)
    {
        var user=new FakeCurrentUserService(1);using var db=Open(user);
        db.Branches.Add(new Branch{Id=1,Code="B",Name="شعبه"});await db.SaveChangesAsync();
        var command=new CreateContactCommand(1,true,false,false,false,"شرکت نمونه",null,"09120000000",null,null,null,null,
            company?new CompanyDetailsDto(null,null,null,null):null,
            company?null:new PersonDetailsDto(null,"سارا","نمونه",null,null));
        Assert.True((await new CreateContactValidator().ValidateAsync(command)).IsValid);
        var created=await new CreateContactHandler(db).Handle(command,default);
        Assert.Equal(created.Id.ToString("D6"),created.CustomerNumber);
        Assert.Equal(company,created.CompanyDetails!=null);
        Assert.Equal(!company,created.PersonDetails!=null);
        var query=new ListContactsQuery(null,created.CustomerNumber,null,null,null,null,null);
        Assert.Equal(created.Id,Assert.Single((await new ListContactsHandler(db,user).Handle(query,default)).Items).Id);
        var persian=string.Concat(created.CustomerNumber.Select(c=>(char)('۰'+c-'0')));
        Assert.Equal(created.Id,Assert.Single((await new ListContactsHandler(db,user).Handle(query with {Search=persian},default)).Items).Id);
        Assert.Single((await new ListContactsHandler(db,user).Handle(query with {Search="0912000"},default)).Items);
    }

    [Fact]
    public async Task OrderPackage_DiscountAndWithholdingSurviveEditAndInvoiceConversion()
    {
        var user=new FakeCurrentUserService(1);using var db=Open(user);UnitTestSeed.Ensure(db);
        db.Branches.Add(new Branch{Id=1,Code="B",Name="شعبه"});
        db.Contacts.Add(new Contact{Id=1,BranchId=1,Code="C",Name="مشتری"});
        db.Items.Add(new Item{Id=1,Code="FOOD",Name="غذا",UnitId=1,Type=ItemType.Service});await db.SaveChangesAsync();
        var created=await new CreateOrderHandler(db,user).Handle(new(1,DateTime.UtcNow,InvoiceType.Sales,"IRR","تحویل ساعت ۱۲",
            new(){new(1,"غذا",2,100,10,10,20)}),default);
        Assert.Equal(180m,created.TotalNet);Assert.Equal(18m,created.TotalVat);
        Assert.Equal(10m,created.Lines[0].DiscountRate);Assert.Equal(20,created.Lines[0].WithholdingRate);
        var updated=await new UpdateOrderHandler(db,user).Handle(new(created.Id,1,DateTime.UtcNow,"تحویل ساعت ۱۳",
            new(){new(created.Lines[0].Id,1,"غذا",3,100,10,10,20)},created.RowVersion),default);
        Assert.Equal(270m,updated.TotalNet);Assert.Equal(27m,updated.TotalVat);
        var order=await db.Orders.SingleAsync();order.Status=OrderStatus.Approved;await db.SaveChangesAsync();
        var id=await new CreateInvoiceFromOrderHandler(db,user).Handle(new(order.Id),default);
        var invoice=await db.Invoices.Include(i=>i.Lines).SingleAsync(i=>i.Id==id);
        Assert.Equal(30m,invoice.TotalDiscount);Assert.Equal(5.4m,invoice.TotalWithholding);
        Assert.Equal(291.6m,invoice.Balance);Assert.Equal("تحویل ساعت ۱۳",invoice.Notes);
        Assert.Equal(10m,Assert.Single(invoice.Lines).DiscountRate);
    }
    [Fact]
    public async Task Subscription_CanBeCreatedUpdatedAndSearched_AndRejectsDuplicatesAcrossBranches()
    {
        var user=new FakeCurrentUserService(1);using var db=Open(user);
        db.Branches.Add(new Branch{Id=1,Code="B",Name="شعبه"});await db.SaveChangesAsync();
        var command=new CreateContactCommand(1,true,false,false,false,"",null,null,null,null,null,null,
            null,new PersonDetailsDto(null,"سارا","نمونه",null,null),SubscriptionNumber:"vip-۱۲۳");
        var handler=new CreateContactHandler(db);
        var created=await handler.Handle(command,default);
        Assert.Equal("VIP-123",created.SubscriptionNumber);
        var matches=await new ListContactsHandler(db,user).Handle(new(null,"vip-۱۲۳",null,null,null,null,null),default);
        Assert.Equal(created.Id,Assert.Single(matches.Items).Id);
        await Assert.ThrowsAsync<Accounting.Application.Common.Exceptions.BusinessRuleException>(()=>handler.Handle(command,default));
        var updated=await new UpdateContactHandler(db,user).Handle(new(created.Id,true,false,false,false,created.Name,
            null,null,null,null,null,null,null,created.PersonDetails,created.RowVersion,SubscriptionNumber:"۴۲"),default);
        Assert.Equal("42",updated.SubscriptionNumber);
        var cleared=await new UpdateContactHandler(db,user).Handle(new(created.Id,true,false,false,false,created.Name,
            null,null,null,null,null,null,null,created.PersonDetails,updated.RowVersion),default);
        Assert.Equal($"AUTO-{created.Id:D6}",cleared.SubscriptionNumber);
        var automatic=await new ListContactsHandler(db,user).Handle(new(null,cleared.SubscriptionNumber,null,null,null,null,null),default);
        Assert.Equal(created.Id,Assert.Single(automatic.Items).Id);
        db.Contacts.Add(new Contact{BranchId=2,Code="OTHER",Name="Other branch",SubscriptionNumber="TAKEN",IsDeleted=true});
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<Accounting.Application.Common.Exceptions.BusinessRuleException>(()=>handler.Handle(command with {SubscriptionNumber="taken"},default));
    }

    [Theory]
    [InlineData(null,true)]
    [InlineData("",true)]
    [InlineData("۰۰۱۲",true)]
    [InlineData("VIP-123",true)]
    [InlineData("auto-000001",false)]
    [InlineData("has space",false)]
    [InlineData("<script>",false)]
    [InlineData("123456789012345678901234567890123",false)]
    public void Subscription_ValidatesManualNumbers(string? value,bool valid)
    {
        Assert.Equal(valid,Accounting.Application.Contacts.SubscriptionNumbers.IsValid(value));
    }

}
