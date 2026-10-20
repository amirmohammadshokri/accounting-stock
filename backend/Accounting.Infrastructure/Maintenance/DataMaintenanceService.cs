using System.Data;
using System.Text.Json;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Infrastructure.Maintenance;

public sealed class DataMaintenanceGate
{
    public SemaphoreSlim Lock { get; }=new(1,1);
    private int active;
    public bool IsActive=>Volatile.Read(ref active)==1;
    public void SetActive(bool value)=>Interlocked.Exchange(ref active,value?1:0);
}
public sealed record DataCount(string Key,string Label,int Count);
public sealed record DataResetResult(DateTime CompletedAtUtc,int DeletedRecords);

public sealed class DataMaintenanceService(AppDbContext db, ICurrentUserService currentUser, IPasswordHasher hasher, DataMaintenanceGate gate)
{
    private static string Normalize(string? value)=>string.Join(" ",(value ?? "").Replace('\u200c',' ').Split(' ',StringSplitOptions.RemoveEmptyEntries));
    public const string Confirmation="پاک‌سازی اطلاعات";
    // Fixed, reviewed table names in FK order. No client-supplied table names, no TRUNCATE,
    // no disabled constraints, no identity reseeding, no dropping schema or security tables.
    public static readonly IReadOnlyList<string> PurgeTables=Array.AsReadOnly(new[]{
        "Payments","InventoryOpeningBalances","ContactOpeningBalances","StockMovements","Stocks",
        "InvoiceLines","Invoices","OrderLines","Orders","Cheques","MealPackageLines","MealPackages",
        "CompanyDetails","PersonDetails","Contacts","Items","Categories","CashBankAccounts"
    });

    public async Task<User> EnsureAdministratorAsync(CancellationToken ct)
    {
        var user=await db.Users.AsNoTracking().Include(x=>x.UserRoles).ThenInclude(x=>x.Role)
            .FirstOrDefaultAsync(x=>x.Id==currentUser.UserId && x.IsActive && !x.IsDeleted,ct);
        if(user==null || !user.UserRoles.Any(x=>x.Role?.Name is "مدیر سامانه" or "Admin"))
            throw new ForbiddenAccessException();
        return user;
    }

    public async Task<IReadOnlyList<DataCount>> PreviewAsync(CancellationToken ct)
    {
        await EnsureAdministratorAsync(ct);
        return new DataCount[]{
            new("invoices","فاکتورها",await db.Invoices.IgnoreQueryFilters().CountAsync(ct)),
            new("orders","سفارش‌ها",await db.Orders.IgnoreQueryFilters().CountAsync(ct)),
            new("payments","دریافت‌ها و پرداخت‌ها",await db.Payments.IgnoreQueryFilters().CountAsync(ct)),
            new("cheques","چک‌ها و سفته‌ها",await db.Cheques.IgnoreQueryFilters().CountAsync(ct)),
            new("contacts","مشتری‌ها و طرف‌حساب‌ها",await db.Contacts.IgnoreQueryFilters().CountAsync(ct)),
            new("items","غذاها، کالاها و خدمات",await db.Items.IgnoreQueryFilters().CountAsync(ct)),
            new("packages","پکیج‌ها",await db.MealPackages.IgnoreQueryFilters().CountAsync(ct)),
            new("categories","دسته‌بندی‌ها",await db.Categories.IgnoreQueryFilters().CountAsync(ct)),
            new("accounts","حساب‌های صندوق و بانک",await db.CashBankAccounts.IgnoreQueryFilters().CountAsync(ct)),
            new("stocks","موجودی انبار",await db.Stocks.IgnoreQueryFilters().CountAsync(ct)),
            new("movements","گردش کالا",await db.StockMovements.IgnoreQueryFilters().CountAsync(ct)),
            new("openingBalances","مانده‌های اول دوره",await db.ContactOpeningBalances.CountAsync(ct)+await db.InventoryOpeningBalances.CountAsync(ct))
        };
    }

    public async Task<DataResetResult> ResetAsync(string password,string confirmation,bool acknowledge,CancellationToken ct)
    {
        var user=await EnsureAdministratorAsync(ct);
        if(!acknowledge || Normalize(confirmation)!=Normalize(Confirmation))
            throw new BusinessRuleException("برای پاک‌سازی، عبارت «پاک‌سازی اطلاعات» و تأیید آگاهی از حذف را وارد کنید.");
        if(string.IsNullOrEmpty(password) || !hasher.VerifyPassword(user.PasswordHash,password))
            throw new BusinessRuleException("رمز حساب مدیر نادرست است؛ هیچ اطلاعاتی پاک نشد.");
        if(!await gate.Lock.WaitAsync(0,ct))throw new BusinessRuleException("پاک‌سازی دیگری در حال اجراست؛ کمی صبر کنید.");
        gate.SetActive(true);
        try
        {
            await using var transaction=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            if(db.Database.IsSqlServer())
            {
                // Also prevents simultaneous resets from multiple API instances.
                await db.Database.ExecuteSqlRawAsync("DECLARE @result int; EXEC @result = sp_getapplock @Resource=N'Accounting.OperationalDataReset', @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=0; IF @result < 0 THROW 51000, N'Data reset is already running', 1;",ct);
            }
            var deleted=0;
            foreach(var table in PurgeTables)
                deleted+=await db.Database.ExecuteSqlRawAsync(string.Concat("DELETE FROM [",table,"]"),ct);
            var completed=DateTime.UtcNow;
            // Preserve this marker and audit history. Optional startup demo never reappears after reset.
            db.AuditTrails.Add(new AuditTrail{EntityName="SystemData",Action="OperationalDataReset",UserId=user.Id,
                TimestampUtc=completed,NewValues=JsonSerializer.Serialize(new{deletedRecords=deleted})});
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new(completed,deleted);
        }
        finally {gate.SetActive(false);gate.Lock.Release();}
    }
}
