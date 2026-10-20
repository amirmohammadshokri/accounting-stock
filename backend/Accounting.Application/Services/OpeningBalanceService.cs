using System.ComponentModel.DataAnnotations;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Microsoft.EntityFrameworkCore;
namespace Accounting.Application.Services;

public record ContactOpeningRequest([Range(1,int.MaxValue)] int ContactId, DateTime DateUtc,
    [Range(typeof(decimal), "0.01", "9999999999999999.99", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)] decimal Amount, [Required] bool? IsDebit,
    [MaxLength(500)] string? Note = null, string? RowVersionBase64 = null);
public record InventoryOpeningRequest([Range(1,int.MaxValue)] int WarehouseId, [Range(1,int.MaxValue)] int ItemId,
    DateTime DateUtc, [Range(typeof(decimal), "0.001", "999999999999999.999", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)] decimal Quantity,
    [Range(typeof(decimal), "0", "99999999999999.9999", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)] decimal? UnitCost = null,
    [MaxLength(500)] string? Note = null, string? RowVersionBase64 = null);
public record OpeningBalanceDto(int Id, int BranchId, DateTime DateUtc, int? ContactId, int? WarehouseId,
    int? ItemId, decimal? Amount, bool? IsDebit, decimal? Quantity, decimal? UnitCost, decimal? TotalCost,
    bool ValuationPending, string? Note, string RowVersionBase64);

public class OpeningBalanceService(IAppDbContext db, ICurrentUserService user)
{
    public async Task<List<OpeningBalanceDto>> Contacts(int? contactId, CancellationToken ct) =>
        (await db.ContactOpeningBalances.AsNoTracking().ApplyBranchFilter(user)
        .Where(x => !x.IsDeleted && (!contactId.HasValue || x.ContactId == contactId)).OrderBy(x => x.Id).ToListAsync(ct)).Select(Map).ToList();
    public async Task<List<OpeningBalanceDto>> Inventory(int? warehouseId, int? itemId, CancellationToken ct) =>
        (await db.InventoryOpeningBalances.AsNoTracking().ApplyBranchFilter(user)
        .Where(x => !x.IsDeleted && (!warehouseId.HasValue || x.WarehouseId == warehouseId) && (!itemId.HasValue || x.ItemId == itemId))
        .OrderBy(x => x.Id).ToListAsync(ct)).Select(Map).ToList();
    static void Date(DateTime date)
    {
        if (date == default || date.Kind == DateTimeKind.Local || date > DateTime.UtcNow)
            throw new BusinessRuleException("تاریخ اول دوره باید معتبر، به وقت UTC و حداکثر امروز باشد.");
    }
    void Version(object entity, string? version)
    {
        if (string.IsNullOrWhiteSpace(version)) throw new BusinessRuleException("نسخه رکورد برای ویرایش یا حذف الزامی است.");
        try { db.Entry(entity).Property("RowVersion").OriginalValue = Convert.FromBase64String(version); }
        catch (FormatException) { throw new BusinessRuleException("نسخه رکورد معتبر نیست."); }
    }
    async Task Save(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ConcurrencyConflictException(); }
        catch (DbUpdateException) { throw new BusinessRuleException("ثبت اطلاعات انجام نشد؛ احتمال ثبت هم‌زمان یا وجود اطلاعات مرتبط را بررسی کنید."); }
    }
    public async Task<OpeningBalanceDto> SaveContact(int? id, ContactOpeningRequest r, CancellationToken ct)
    {
        Date(r.DateUtc);
        if (!r.IsDebit.HasValue) throw new BusinessRuleException("جهت بدهکاری یا بستانکاری الزامی است.");
        if (r.Amount <= 0 || decimal.Round(r.Amount,2) != r.Amount) throw new BusinessRuleException("مبلغ باید مثبت و حداکثر دو رقم اعشار باشد.");
        var contact = await db.Contacts.ApplyBranchFilter(user).FirstOrDefaultAsync(x => x.Id == r.ContactId && !x.IsDeleted,ct)
            ?? throw new NotFoundException("Contact",r.ContactId);
        await using var tx = await db.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        var entry = id.HasValue ? await db.ContactOpeningBalances.ApplyBranchFilter(user).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted,ct)
            ?? throw new NotFoundException("مانده اول دوره",id) : new ContactOpeningBalance();
        if (id.HasValue)
        {
            if (entry.ContactId != r.ContactId) throw new BusinessRuleException("طرف حساب رکورد قابل تغییر نیست.");
            Version(entry,r.RowVersionBase64);
            await CheckContactUnused(r.ContactId,ct);
        }
        else if (await db.ContactOpeningBalances.AnyAsync(x => x.ContactId == r.ContactId && !x.IsDeleted,ct))
            throw new BusinessRuleException("مانده اول دوره این طرف حساب قبلاً ثبت شده است.");
        if (await db.Invoices.AnyAsync(x => x.ContactId == r.ContactId && x.DateUtc < r.DateUtc && !x.IsDeleted,ct)
            || await db.Payments.AnyAsync(x => x.ContactId == r.ContactId && x.DateUtc < r.DateUtc && !x.IsDeleted,ct))
            throw new BusinessRuleException("تاریخ اول دوره نمی‌تواند بعد از گردش‌های قبلی طرف حساب باشد.");
        entry.ContactId = r.ContactId; entry.BranchId = contact.BranchId; entry.DateUtc = DateTime.SpecifyKind(r.DateUtc,DateTimeKind.Utc);
        entry.Amount = r.Amount; entry.IsDebit = r.IsDebit.Value; entry.Note = r.Note?.Trim();
        if (!id.HasValue) db.ContactOpeningBalances.Add(entry);
        await Save(ct); await tx.CommitAsync(ct); return Map(entry);
    }
    async Task CheckContactUnused(int contactId, CancellationToken ct)
    {
        if (await db.Invoices.AnyAsync(x => x.ContactId == contactId && !x.IsDeleted,ct) || await db.Payments.AnyAsync(x => x.ContactId == contactId && !x.IsDeleted,ct)
            || await db.Cheques.AnyAsync(x => x.ContactId == contactId && !x.IsDeleted,ct))
            throw new BusinessRuleException("پس از ثبت گردش مالی، ویرایش یا حذف مانده اول دوره مجاز نیست.");
    }
    public async Task<OpeningBalanceDto> SaveInventory(int? id, InventoryOpeningRequest r, CancellationToken ct)
    {
        Date(r.DateUtc);
        if (r.Quantity <= 0 || decimal.Round(r.Quantity,3) != r.Quantity || r.UnitCost < 0 || (r.UnitCost.HasValue && decimal.Round(r.UnitCost.Value,4) != r.UnitCost))
            throw new BusinessRuleException("تعداد باید مثبت با حداکثر سه رقم اعشار و بها نامنفی با حداکثر چهار رقم اعشار باشد.");
        if (r.UnitCost.HasValue && r.Quantity * r.UnitCost.Value > 9999999999999999.99m) throw new BusinessRuleException("ارزش کل از محدوده مجاز بیشتر است.");
        var warehouse = await db.Warehouses.ApplyBranchFilter(user).FirstOrDefaultAsync(x => x.Id == r.WarehouseId && !x.IsDeleted,ct)
            ?? throw new NotFoundException("Warehouse",r.WarehouseId);
        if (!await db.Items.AnyAsync(x => x.Id == r.ItemId && x.Type == ItemType.Inventory && !x.IsDeleted,ct))
            throw new BusinessRuleException("موجودی اول دوره فقط برای کالای انباری فعال قابل ثبت است.");
        await using var tx = await db.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        var entry = id.HasValue ? await db.InventoryOpeningBalances.ApplyBranchFilter(user).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted,ct)
            ?? throw new NotFoundException("موجودی اول دوره",id) : new InventoryOpeningBalance();
        if (id.HasValue)
        {
            if (entry.ItemId != r.ItemId || entry.WarehouseId != r.WarehouseId) throw new BusinessRuleException("کالا و انبار رکورد قابل تغییر نیستند.");
            Version(entry,r.RowVersionBase64);
        }
        else if (await db.InventoryOpeningBalances.AnyAsync(x => x.WarehouseId == r.WarehouseId && x.ItemId == r.ItemId && !x.IsDeleted,ct))
            throw new BusinessRuleException("موجودی اول دوره این کالا در انبار قبلاً ثبت شده است.");
        var quantityChanged = !id.HasValue || entry.Quantity != r.Quantity || entry.DateUtc != r.DateUtc;
        if (quantityChanged) await CheckInventoryUnused(r.WarehouseId,r.ItemId,entry.StockMovementId,ct);
        var stock = await db.Stocks.FirstOrDefaultAsync(x => x.WarehouseId == r.WarehouseId && x.ItemId == r.ItemId && !x.IsDeleted,ct);
        if (!id.HasValue && stock?.Quantity > 0) throw new BusinessRuleException("این کالا موجودی دارد؛ ابتدا منشأ موجودی موجود را بررسی کنید.");
        if (stock == null) { stock = new Stock { BranchId = warehouse.BranchId, WarehouseId = r.WarehouseId, ItemId = r.ItemId }; db.Stocks.Add(stock); }
        if (quantityChanged) stock.Quantity = StockQuantityCalculator.ApplyMovement(stock.Quantity - entry.Quantity,StockMovementType.OpeningBalance,r.Quantity);
        StockMovement movement;
        if (entry.StockMovementId.HasValue) movement = await db.StockMovements.FirstAsync(x => x.Id == entry.StockMovementId,ct);
        else { movement = new StockMovement { BranchId = warehouse.BranchId, WarehouseId = r.WarehouseId, ItemId = r.ItemId, Type = StockMovementType.OpeningBalance }; db.StockMovements.Add(movement); }
        movement.Quantity = r.Quantity; movement.TransactionDateUtc = DateTime.SpecifyKind(r.DateUtc,DateTimeKind.Utc); movement.Note = "موجودی اول دوره";
        entry.BranchId = warehouse.BranchId; entry.WarehouseId = r.WarehouseId; entry.ItemId = r.ItemId;
        entry.Quantity = r.Quantity; entry.UnitCost = r.UnitCost; entry.DateUtc = movement.TransactionDateUtc; entry.Note = r.Note?.Trim();
        await Save(ct);
        entry.StockMovementId = movement.Id;
        if (!id.HasValue) db.InventoryOpeningBalances.Add(entry);
        await Save(ct); await tx.CommitAsync(ct); return Map(entry);
    }
    async Task CheckInventoryUnused(int warehouseId, int itemId, int? movementId, CancellationToken ct)
    {
        if (await db.StockMovements.AnyAsync(x => x.WarehouseId == warehouseId && x.ItemId == itemId && !x.IsDeleted && (!movementId.HasValue || x.Id != movementId),ct))
            throw new BusinessRuleException("پس از ثبت گردش انبار، تغییر تعداد، تاریخ یا حذف موجودی اول دوره مجاز نیست؛ تکمیل بها امکان‌پذیر است.");
    }
    public async Task DeleteContact(int id, string version, CancellationToken ct)
    {
        await using var tx = await db.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        var entry = await db.ContactOpeningBalances.ApplyBranchFilter(user).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted,ct) ?? throw new NotFoundException("مانده اول دوره",id);
        Version(entry,version); await CheckContactUnused(entry.ContactId,ct);
        entry.IsDeleted = true; entry.DeletedAtUtc = DateTime.UtcNow; await Save(ct); await tx.CommitAsync(ct);
    }
    public async Task DeleteInventory(int id, string version, CancellationToken ct)
    {
        await using var tx = await db.BeginTransactionAsync(System.Data.IsolationLevel.Serializable,ct);
        var entry = await db.InventoryOpeningBalances.ApplyBranchFilter(user).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted,ct) ?? throw new NotFoundException("موجودی اول دوره",id);
        Version(entry,version); await CheckInventoryUnused(entry.WarehouseId,entry.ItemId,entry.StockMovementId,ct);
        var stock = await db.Stocks.FirstAsync(x => x.WarehouseId == entry.WarehouseId && x.ItemId == entry.ItemId && !x.IsDeleted,ct);
        if (stock.Quantity < entry.Quantity) throw new BusinessRuleException("حذف موجب موجودی منفی می‌شود.");
        stock.Quantity -= entry.Quantity;
        var movement = await db.StockMovements.FirstAsync(x => x.Id == entry.StockMovementId,ct);
        movement.IsDeleted = true; movement.DeletedAtUtc = DateTime.UtcNow;
        entry.IsDeleted = true; entry.DeletedAtUtc = DateTime.UtcNow; await Save(ct); await tx.CommitAsync(ct);
    }
    static OpeningBalanceDto Map(ContactOpeningBalance x) => new(x.Id,x.BranchId,x.DateUtc,x.ContactId,null,null,x.Amount,x.IsDebit,null,null,null,false,x.Note,Convert.ToBase64String(x.RowVersion));
    static OpeningBalanceDto Map(InventoryOpeningBalance x) => new(x.Id,x.BranchId,x.DateUtc,null,x.WarehouseId,x.ItemId,null,null,x.Quantity,x.UnitCost,x.UnitCost.HasValue ? decimal.Round(x.Quantity*x.UnitCost.Value,2,MidpointRounding.AwayFromZero) : null,!x.UnitCost.HasValue,x.Note,Convert.ToBase64String(x.RowVersion));
}
