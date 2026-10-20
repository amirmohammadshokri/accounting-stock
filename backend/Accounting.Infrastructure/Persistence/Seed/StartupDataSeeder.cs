using Accounting.Application.Common.Interfaces;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Infrastructure.Persistence.Seed;

public static class StartupDataSeeder
{
    public static async Task InitializeAsync(AppDbContext db, IInvoiceBalanceService invoiceBalances,
        IAccountBalanceService accountBalances, IPasswordHasher hasher, string mode="Raw", string adminPassword="Demo1405!", CancellationToken ct=default)
    {
        if(mode is not ("Raw" or "PersianDemo")) throw new InvalidOperationException("Seeding:Mode must be Raw or PersianDemo.");
        if(mode=="Raw")
        {
            await SeedEssentialAsync(db,hasher,adminPassword,ct);
            return;
        }
        var initialized=await db.AuditTrails.AnyAsync(x=>x.EntityName=="SystemData" &&
            (x.Action=="SampleDataInitialized" || x.Action=="OperationalDataReset"),ct);
        var hasOperationalData=await db.Items.IgnoreQueryFilters().AnyAsync(ct) || await db.Contacts.IgnoreQueryFilters().AnyAsync(ct)
            || await db.Invoices.IgnoreQueryFilters().AnyAsync(ct) || await db.Orders.IgnoreQueryFilters().AnyAsync(ct)
            || await db.Payments.IgnoreQueryFilters().AnyAsync(ct) || await db.CashBankAccounts.IgnoreQueryFilters().AnyAsync(ct)
            || await db.Categories.IgnoreQueryFilters().AnyAsync(ct) || await db.MealPackages.IgnoreQueryFilters().AnyAsync(ct)
            || await db.Cheques.IgnoreQueryFilters().AnyAsync(ct) || await db.Stocks.IgnoreQueryFilters().AnyAsync(ct)
            || await db.StockMovements.IgnoreQueryFilters().AnyAsync(ct) || await db.ContactOpeningBalances.IgnoreQueryFilters().AnyAsync(ct)
            || await db.InventoryOpeningBalances.IgnoreQueryFilters().AnyAsync(ct);
        if(mode=="PersianDemo" && !initialized && !hasOperationalData)
        {
            await DataSeeder.SeedAsync(db,invoiceBalances,accountBalances,hasher,ct,adminPassword);
            db.AuditTrails.Add(new AuditTrail{EntityName="SystemData",Action="SampleDataInitialized",TimestampUtc=DateTime.UtcNow});
            await db.SaveChangesAsync(ct);
            return;
        }
        await SeedEssentialAsync(db,hasher,adminPassword,ct);
    }

    public static async Task SeedEssentialAsync(AppDbContext db, IPasswordHasher hasher, string adminPassword, CancellationToken ct=default)
    {
        if(!await db.CompanySettings.AnyAsync(ct))db.CompanySettings.Add(new CompanySettings{Title="کترینگ"});
        var branch=await db.Branches.Where(x=>!x.IsDeleted).OrderByDescending(x=>x.IsHeadquarters).ThenBy(x=>x.Id).FirstOrDefaultAsync(ct);
        if(branch==null)
        {
            var code=await db.Branches.IgnoreQueryFilters().AnyAsync(x=>x.Code=="مرکزی",ct) ? "مرکزی-"+Guid.NewGuid().ToString("N")[..8] : "مرکزی";
            branch=new Branch{Code=code,Name="شعبه مرکزی",IsHeadquarters=true};db.Branches.Add(branch);
        }
        await db.SaveChangesAsync(ct);
        if(!await db.Warehouses.AnyAsync(x=>x.BranchId==branch.Id && !x.IsDeleted,ct))
            db.Warehouses.Add(new Warehouse{BranchId=branch.Id,Code="انبار",Name="انبار اصلی",IsDefault=true});
        foreach(var name in new[]{"پرس","عدد","کیلوگرم","بسته","لیتر","ساعت","ماه"})
            if(!await db.Units.IgnoreQueryFilters().AnyAsync(x=>x.Name==name,ct))db.Units.Add(new Accounting.Domain.Entities.Unit{Name=name});
        await DataSeeder.SeedRolesAsync(db,ct);
        // Bootstrap only an empty user database; never reset a password or recreate deleted accounts.
        if(!await db.Users.IgnoreQueryFilters().AnyAsync(ct))
        {
            var role=await db.Roles.FirstAsync(x=>x.Name=="مدیر سامانه",ct);
            var admin=new User{Email="admin@demo.local",FirstName="مدیر",LastName="سامانه",PasswordHash=hasher.HashPassword(adminPassword),IsActive=true,BranchId=branch.Id};
            admin.UserRoles.Add(new UserRole{RoleId=role.Id});db.Users.Add(admin);
        }
        await db.SaveChangesAsync(ct);
    }
}
