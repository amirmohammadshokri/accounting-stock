using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Authentication;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Infrastructure.Persistence.Seed;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace Accounting.Tests;
public class StartupDataTests
{
    [Fact]
    public async Task RawBootstrap_HasPersianEssentialsAndWorkingAdministratorOnly()
    {
        await using var db = CreateDb();
        const string password = "InitialAdmin1405!";
        await Initialize(db, password: password);
        var admin = await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.Permissions).SingleAsync();
        Assert.Equal("admin@demo.local", admin.Email);
        Assert.Equal("مدیر سامانه", admin.FullName);
        Assert.True(new PasswordHasher().VerifyPassword(admin.PasswordHash, password));
        Assert.Equal("مدیر سامانه", Assert.Single(admin.UserRoles).Role.Name);
        Assert.All(Accounting.Domain.Constants.Permissions.GetAll(), permission =>
            Assert.Contains(admin.UserRoles.SelectMany(ur => ur.Role.Permissions), p => p.Permission == permission));
        Assert.True((await db.Branches.SingleAsync()).IsHeadquarters);
        Assert.True((await db.Warehouses.SingleAsync()).IsDefault);
        Assert.Equal(7, await db.Units.CountAsync());
        Assert.All(await db.Roles.ToListAsync(), role =>
        {
            Assert.Matches("[\u0600-\u06FF]", role.Name);
            Assert.Matches("[\u0600-\u06FF]", role.Description!);
        });
    }

    [Fact]
    public async Task RawBootstrap_RejectsMissingPasswordBeforeWritingEssentials()
    {
        await using var db = CreateDb();
        await Assert.ThrowsAsync<InvalidOperationException>(() => StartupDataSeeder.SeedEssentialAsync(db, new PasswordHasher(), ""));
        Assert.Empty(await db.Users.ToListAsync());
        Assert.Empty(await db.CompanySettings.ToListAsync());
        Assert.Empty(await db.Branches.ToListAsync());
    }

    [Fact]
    public async Task Restart_PreservesRemovedBuiltInAdminPermissionWithoutResettingPassword()
    {
        await using var db = CreateDb();
        await Initialize(db);
        var hash = (await db.Users.SingleAsync()).PasswordHash;
        var role = await db.Roles.Include(r => r.Permissions).SingleAsync(r => r.Name == "مدیر سامانه");
        var removed = role.Permissions.First();
        var permission = removed.Permission;
        db.RolePermissions.Remove(removed);
        await db.SaveChangesAsync();
        await Initialize(db, password: "AnotherPassword1405!");
        Assert.DoesNotContain(await db.RolePermissions.Where(p => p.RoleId == role.Id).ToListAsync(), p => p.Permission == permission);
        Assert.Equal(hash, (await db.Users.SingleAsync()).PasswordHash);
        Assert.Single(await db.Users.ToListAsync());
    }

    private static AppDbContext CreateDb()
    {
        var user=new FakeCurrentUserService(1);
        return new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(x=>x.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options,new AuditSaveChangesInterceptor(user),user);
    }
    private static Task Initialize(AppDbContext db,string mode="Raw",string password="Admin123!")=>
        StartupDataSeeder.InitializeAsync(db,new InvoiceBalanceService(db),new AccountBalanceService(db),new PasswordHasher(),mode,password);
    [Fact]
    public async Task DefaultStartup_IsRaw_IdempotentAndPreservesExistingDataPasswordsAndLicense()
    {
        await using var db=CreateDb();await Initialize(db);
        Assert.Single(await db.Users.ToListAsync());Assert.Equal("admin@demo.local",(await db.Users.SingleAsync()).Email);
        Assert.NotEmpty(await db.Roles.ToListAsync());Assert.Single(await db.Branches.ToListAsync());Assert.Single(await db.Warehouses.ToListAsync());
        Assert.Empty(await db.Items.ToListAsync());Assert.Empty(await db.Categories.ToListAsync());Assert.Empty(await db.Contacts.ToListAsync());
        Assert.Empty(await db.Invoices.ToListAsync());Assert.Empty(await db.Orders.ToListAsync());Assert.Empty(await db.Payments.ToListAsync());
        Assert.Empty(await db.CashBankAccounts.ToListAsync());Assert.Empty(await db.Stocks.ToListAsync());Assert.Empty(await db.MealPackages.ToListAsync());
        var hash=(await db.Users.SingleAsync()).PasswordHash;
        var expiry=DateTime.UtcNow.AddDays(50);(await db.CompanySettings.SingleAsync()).LicenseExpiresAtUtc=expiry;
        db.Items.Add(new Item{Code="REAL",Name="اطلاعات واقعی مشتری"});await db.SaveChangesAsync();
        await Initialize(db,password:"Another123!");
        Assert.Single(await db.Users.ToListAsync());Assert.Equal(hash,(await db.Users.SingleAsync()).PasswordHash);
        Assert.Equal(expiry,(await db.CompanySettings.SingleAsync()).LicenseExpiresAtUtc);Assert.Equal("اطلاعات واقعی مشتری",(await db.Items.SingleAsync()).Name);
    }
    [Fact]
    public async Task OptionalDemo_IsPersianCateringAndDoesNotDuplicateOnRestart()
    {
        await using var db=CreateDb();await Initialize(db,"PersianDemo");
        Assert.True(await db.Items.CountAsync()>=10);Assert.True(await db.Contacts.CountAsync()>=10);Assert.True(await db.Invoices.CountAsync()>=10);
        Assert.True(await db.Orders.CountAsync()>=10);Assert.NotEmpty(await db.MealPackages.ToListAsync());
        foreach(var name in await db.Items.Select(x=>x.Name).ToListAsync())Assert.Matches("[\u0600-\u06FF]",name);
        Assert.Contains(await db.Items.ToListAsync(),x=>x.Name=="زرشک‌پلو با مرغ");
        Assert.All(await db.Invoices.Include(x=>x.Lines).ToListAsync(),invoice=>Assert.All(invoice.Lines,line=>Assert.Matches("[\u0600-\u06FF]",line.Unit)));
        var invoices=await db.Invoices.CountAsync();var contacts=await db.Contacts.CountAsync();var payments=await db.Payments.CountAsync();
        await Initialize(db,"PersianDemo");
        Assert.Equal(invoices,await db.Invoices.CountAsync());Assert.Equal(contacts,await db.Contacts.CountAsync());Assert.Equal(payments,await db.Payments.CountAsync());
    }
    [Fact]
    public async Task OptionalDemo_DoesNotAddSamplesToAnExistingCustomerDatabase()
    {
        await using var db=CreateDb();await Initialize(db);
        db.Items.Add(new Item{Code="REAL",Name="غذای واقعی"});await db.SaveChangesAsync();await Initialize(db,"PersianDemo");
        Assert.Single(await db.Items.ToListAsync());Assert.Empty(await db.Invoices.ToListAsync());Assert.Empty(await db.Contacts.ToListAsync());
    }
    [Fact]
    public async Task ExistingCategoryOnly_IsEnoughToPreventSampleImport()
    {
        await using var db=CreateDb();await Initialize(db);
        db.Categories.Add(new Category{Name="دسته واقعی",RowVersion=Array.Empty<byte>()});await db.SaveChangesAsync();
        await Initialize(db,"PersianDemo");Assert.Single(await db.Categories.ToListAsync());Assert.Empty(await db.Items.ToListAsync());
    }
    [Fact]
    public async Task UnknownMode_IsRejectedInsteadOfAccidentallyCreatingSamples()
    {
        await using var db=CreateDb();await Assert.ThrowsAsync<InvalidOperationException>(()=>Initialize(db,"unknown"));Assert.Empty(await db.Users.ToListAsync());
    }
}
