using System.Data.Common;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Authentication;
using Accounting.Infrastructure.Maintenance;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Infrastructure.Persistence.Seed;
using Accounting.Tests.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace Accounting.Tests;

public class DataMaintenanceTests
{
    private sealed class TestDb(DbContextOptions<AppDbContext> options,AuditSaveChangesInterceptor audit,FakeCurrentUserService user):AppDbContext(options,audit,user)
    {
        protected override void OnModelCreating(ModelBuilder model)
        {
            base.OnModelCreating(model);
            // SQL Server generates rowversion/default timestamps. SQLite test DB supplies them.
            foreach(var entity in model.Model.GetEntityTypes())foreach(var property in entity.GetProperties())
            {
                if(property.GetDefaultValueSql()!=null)property.SetDefaultValueSql(null);
                if(property.Name=="RowVersion")
                {
                    property.ValueGenerated=ValueGenerated.Never;
                    property.SetBeforeSaveBehavior(PropertySaveBehavior.Save);
                    property.SetAfterSaveBehavior(PropertySaveBehavior.Save);
                }
            }
        }
    }
    private sealed class FailDelete:DbCommandInterceptor
    {
        public bool Enabled {get;set;}
        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(DbCommand command,CommandEventData data,InterceptionResult<int> result,CancellationToken ct=default)
        {
            if(Enabled && command.CommandText=="DELETE FROM [Items]")throw new InvalidOperationException("Simulated failure halfway through reset");
            return base.NonQueryExecutingAsync(command,data,result,ct);
        }
    }
    private sealed class Fixture:IAsyncDisposable
    {
        public readonly SqliteConnection Connection=new("Data Source=:memory:;Foreign Keys=True");
        public readonly FakeCurrentUserService User=new(1){IsAdmin=true};
        public readonly PasswordHasher Hasher=new();
        public readonly DataMaintenanceGate Gate=new();
        public readonly FailDelete Fail=new();
        public AppDbContext Db=null!;
        public DataMaintenanceService Service=>new(Db,User,Hasher,Gate);
        public async Task Initialize()
        {
            await Connection.OpenAsync();
            Db=new TestDb(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(Connection).AddInterceptors(Fail).Options,new AuditSaveChangesInterceptor(User),User);
            await Db.Database.EnsureCreatedAsync();
            await StartupDataSeeder.SeedEssentialAsync(Db,Hasher,"Admin123!");
            User.UserIdOverride=(await Db.Users.SingleAsync()).Id;
            var settings=await Db.CompanySettings.SingleAsync();settings.LicenseExpiresAtUtc=new DateTime(2030,1,1,0,0,0,DateTimeKind.Utc);
            var branch=await Db.Branches.SingleAsync();branch.LogoDataUrl="preserved-logo";
            var category=new Category{Name="غذا",RowVersion=Array.Empty<byte>()};Db.Categories.Add(category);
            var item=new Item{Code="FOOD",Name="زرشک‌پلو",Category=category,UnitId=(await Db.Units.FirstAsync()).Id};Db.Items.Add(item);
            var person=new Contact{Code="CUSTOMER",Name="رضا رضایی",BranchId=branch.Id,IsCustomer=true,PersonDetails=new PersonDetails{FirstName="رضا",LastName="رضایی"}};
            var company=new Contact{Code="COMPANY",Name="شرکت نمونه",BranchId=branch.Id,CompanyDetails=new CompanyDetails{TaxNumber="123"}};
            Db.Contacts.AddRange(person,company);await Db.SaveChangesAsync();
            var order=new Order{OrderNumber="SO-1",BranchId=branch.Id,ContactId=person.Id,DateUtc=DateTime.UtcNow};
            order.Lines.Add(new OrderLine{ItemId=item.Id,Description=item.Name,Quantity=1,UnitPrice=100});Db.Orders.Add(order);
            await Db.SaveChangesAsync();
            var invoice=new Invoice{InvoiceNumber="SALE-1",Type=InvoiceType.Sales,BranchId=branch.Id,ContactId=person.Id,OrderId=order.Id,DateUtc=DateTime.UtcNow};
            invoice.Lines.Add(new InvoiceLine{ItemId=item.Id,ItemCode=item.Code,ItemName=item.Name,Unit="پرس",Qty=1,UnitPrice=100});Db.Invoices.Add(invoice);
            var account=new CashBankAccount{BranchId=branch.Id,Code="CASH",Name="صندوق",Balance=500};Db.CashBankAccounts.Add(account);
            var cheque=new Cheque{BranchId=branch.Id,ContactId=person.Id,ChequeNumber="CH-1",Amount=100,Currency="IRR"};Db.Cheques.Add(cheque);
            var warehouse=await Db.Warehouses.SingleAsync();
            Db.Stocks.Add(new Stock{BranchId=branch.Id,WarehouseId=warehouse.Id,ItemId=item.Id,Quantity=10});
            await Db.SaveChangesAsync();
            Db.Payments.Add(new Payment{BranchId=branch.Id,AccountId=account.Id,ContactId=person.Id,LinkedInvoiceId=invoice.Id,ChequeId=cheque.Id,Amount=100});
            var movement=new StockMovement{BranchId=branch.Id,WarehouseId=warehouse.Id,ItemId=item.Id,InvoiceId=invoice.Id,Quantity=10,Type=StockMovementType.OpeningBalance};Db.StockMovements.Add(movement);
            await Db.SaveChangesAsync();
            Db.InventoryOpeningBalances.Add(new InventoryOpeningBalance{BranchId=branch.Id,WarehouseId=warehouse.Id,ItemId=item.Id,StockMovementId=movement.Id,Quantity=10});
            Db.ContactOpeningBalances.Add(new ContactOpeningBalance{BranchId=branch.Id,ContactId=person.Id,Amount=100});
            Db.MealPackages.Add(new MealPackage{Name="پکیج",Lines=new(){new MealPackageLine{ItemId=item.Id,Quantity=1}}});
            await Db.SaveChangesAsync();
            // Include a soft-deleted row: reset must physically remove it too.
            Db.Contacts.Remove(company);await Db.SaveChangesAsync();Db.ChangeTracker.Clear();
        }
        public async ValueTask DisposeAsync(){await Db.DisposeAsync();await Connection.DisposeAsync();}
    }

    [Fact]
    public async Task Reset_DeletesAllOperationalData_PreservesSecurityConfigurationLicenseAndAudit()
    {
        await using var f=new Fixture();await f.Initialize();
        var password=(await f.Db.Users.SingleAsync()).PasswordHash;
        var users=await f.Db.Users.CountAsync();var roles=await f.Db.Roles.CountAsync();var audits=await f.Db.AuditTrails.CountAsync();
        var preview=await f.Service.PreviewAsync(default);Assert.Equal(2,preview.Single(x=>x.Key=="contacts").Count);
        var result=await f.Service.ResetAsync("Admin123!",DataMaintenanceService.Confirmation,true,default);
        Assert.True(result.DeletedRecords>0);
        foreach(var table in DataMaintenanceService.PurgeTables)
            Assert.Equal(0,await f.Db.Database.SqlQueryRaw<int>(string.Concat("SELECT COUNT(*) AS Value FROM [",table,"]")).SingleAsync());
        Assert.Equal(users,await f.Db.Users.CountAsync());Assert.Equal(roles,await f.Db.Roles.CountAsync());
        Assert.Equal(password,(await f.Db.Users.SingleAsync()).PasswordHash);
        Assert.Equal(new DateTime(2030,1,1),(await f.Db.CompanySettings.SingleAsync()).LicenseExpiresAtUtc);
        Assert.Equal("preserved-logo",(await f.Db.Branches.SingleAsync()).LogoDataUrl);
        Assert.NotEmpty(await f.Db.Warehouses.ToListAsync());Assert.NotEmpty(await f.Db.Units.ToListAsync());
        Assert.Equal(audits+1,await f.Db.AuditTrails.CountAsync());Assert.False(f.Gate.IsActive);
        // A restart in optional demo mode must not repopulate the newly cleaned database.
        await StartupDataSeeder.InitializeAsync(f.Db,new InvoiceBalanceService(f.Db),new AccountBalanceService(f.Db),f.Hasher,"PersianDemo");
        Assert.Empty(await f.Db.Items.ToListAsync());Assert.Empty(await f.Db.Invoices.ToListAsync());
    }
    [Fact]
    public async Task FailureDuringDeletion_RollsBackEveryTableAndReleasesGate()
    {
        await using var f=new Fixture();await f.Initialize();f.Fail.Enabled=true;
        await Assert.ThrowsAsync<InvalidOperationException>(()=>f.Service.ResetAsync("Admin123!",DataMaintenanceService.Confirmation,true,default));
        Assert.Equal(1,await f.Db.Payments.CountAsync());Assert.Equal(1,await f.Db.Invoices.CountAsync());
        Assert.Equal(1,await f.Db.StockMovements.CountAsync());Assert.Equal(2,await f.Db.Contacts.IgnoreQueryFilters().CountAsync());
        Assert.False(await f.Db.AuditTrails.AnyAsync(x=>x.Action=="OperationalDataReset"));Assert.False(f.Gate.IsActive);
    }
    [Theory]
    [InlineData("Wrong!","پاک‌سازی اطلاعات",true)]
    [InlineData("Admin123!","تأیید",true)]
    [InlineData("Admin123!","پاک‌سازی اطلاعات",false)]
    public async Task InvalidConfirmation_DoesNotDeleteAnything(string password,string confirmation,bool acknowledge)
    {
        await using var f=new Fixture();await f.Initialize();
        await Assert.ThrowsAsync<BusinessRuleException>(()=>f.Service.ResetAsync(password,confirmation,acknowledge,default));
        Assert.Equal(1,await f.Db.Invoices.CountAsync());Assert.Equal(1,await f.Db.Payments.CountAsync());
    }
    [Fact]
    public async Task RevokedAdminRole_IsRejectedEvenWithOldAdminClaims()
    {
        await using var f=new Fixture();await f.Initialize();
        await f.Db.UserRoles.ExecuteDeleteAsync();
        await Assert.ThrowsAsync<ForbiddenAccessException>(()=>f.Service.ResetAsync("Admin123!",DataMaintenanceService.Confirmation,true,default));
        Assert.Equal(1,await f.Db.Invoices.CountAsync());
    }
}
