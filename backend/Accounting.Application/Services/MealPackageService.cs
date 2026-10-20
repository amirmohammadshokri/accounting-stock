using System.Text.Json.Serialization;
using Accounting.Application.Common.JsonConverters;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace Accounting.Application.Services;

public record MealPackageRow(int ItemId, [property: JsonConverter(typeof(QuantityJsonConverter))] decimal Quantity, [property: JsonConverter(typeof(UnitPriceJsonConverter))] decimal UnitPrice, int VatRate, [property: JsonConverter(typeof(PercentJsonConverter))] decimal DiscountRate = 0, int WithholdingRate = 0);
public record SaveMealPackage(string Name, IReadOnlyList<MealPackageRow> Lines, string? RowVersion = null);
public record MealPackageRowDto(int ItemId, string Code, string Name, string Unit, [property: JsonConverter(typeof(QuantityJsonConverter))] decimal Quantity, [property: JsonConverter(typeof(UnitPriceJsonConverter))] decimal UnitPrice, int VatRate, [property: JsonConverter(typeof(PercentJsonConverter))] decimal DiscountRate, int WithholdingRate, bool Available);
public record MealPackageDto(int Id, string Name, string RowVersion, IReadOnlyList<MealPackageRowDto> Lines);

public class MealPackageService(IAppDbContext db)
{
    public async Task<List<MealPackageDto>> List(CancellationToken ct)
    {
        var packages = await db.MealPackages.AsNoTracking().Include(x => x.Lines).OrderBy(x => x.Name).ToListAsync(ct);
        // Resolve catalog names on every read, including deleted items so users can repair old packages.
        var ids = packages.SelectMany(x => x.Lines).Select(x => x.ItemId).Distinct().ToList();
        var items = await db.Items.IgnoreQueryFilters().AsNoTracking().Include(x => x.Unit).Where(x => ids.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        return packages.Select(p => new MealPackageDto(p.Id, p.Name, Convert.ToBase64String(p.RowVersion),
            p.Lines.OrderBy(l => l.Position).Select(l => {
                var item = items.GetValueOrDefault(l.ItemId);
                return new MealPackageRowDto(l.ItemId, item?.Code ?? "", item?.Name ?? "کالای حذف‌شده", item?.Unit?.Name ?? "",
                    l.Quantity, l.UnitPrice, l.VatRate, l.DiscountRate, l.WithholdingRate, item != null && !item.IsDeleted);
            }).ToList())).ToList();
    }
    public async Task<MealPackageDto> Save(int? id, SaveMealPackage request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 128 || request.Lines == null || request.Lines.Count is < 1 or > 100)
            throw new BusinessRuleException("نام پکیج و بین ۱ تا ۱۰۰ ردیف غذا یا خدمت وارد کنید.");
        if (request.Lines.Any(l => l.Quantity <= 0 || l.Quantity > 1000000 || decimal.Round(l.Quantity, 3) != l.Quantity || l.UnitPrice < 0 || l.UnitPrice > 1000000000000 || decimal.Round(l.UnitPrice, 4) != l.UnitPrice || l.VatRate is < 0 or > 100 || l.DiscountRate is < 0 or > 100 || decimal.Round(l.DiscountRate, 2) != l.DiscountRate || l.WithholdingRate is < 0 or > 100))
            throw new BusinessRuleException("تعداد، قیمت یا درصد ردیف‌های پکیج معتبر نیست.");
        var ids = request.Lines.Select(l => l.ItemId).Distinct().ToList();
        if (await db.Items.CountAsync(i => ids.Contains(i.Id), ct) != ids.Count)
            throw new BusinessRuleException("یکی از غذاها یا خدمات پکیج حذف شده یا معتبر نیست.");
        var entity = id.HasValue ? await db.MealPackages.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("MealPackage", id.Value) : new MealPackage();
        if (id.HasValue) CheckVersion(entity, request.RowVersion);
        else db.MealPackages.Add(entity);
        entity.Name = request.Name.Trim();
        if (id.HasValue) entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.Lines.Clear();
        entity.Lines.AddRange(request.Lines.Select((l, i) => new MealPackageLine { Position = i, ItemId = l.ItemId,
            Quantity = l.Quantity, UnitPrice = l.UnitPrice, VatRate = l.VatRate, DiscountRate = l.DiscountRate, WithholdingRate = l.WithholdingRate }));
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ConcurrencyConflictException(); }
        return (await List(ct)).First(x => x.Id == entity.Id);
    }
    public async Task Delete(int id, string version, CancellationToken ct)
    {
        var entity = await db.MealPackages.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("MealPackage", id);
        CheckVersion(entity, version); entity.IsDeleted = true; entity.DeletedAtUtc = DateTime.UtcNow;
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ConcurrencyConflictException(); }
    }
    private void CheckVersion(MealPackage entity, string? version)
    {
        if (version == null || version != Convert.ToBase64String(entity.RowVersion)) throw new ConcurrencyConflictException();
        db.Entry(entity).Property(nameof(MealPackage.RowVersion)).OriginalValue = entity.RowVersion;
    }
}
