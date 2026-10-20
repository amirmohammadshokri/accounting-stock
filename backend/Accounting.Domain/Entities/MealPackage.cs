using Accounting.Domain.Common;
namespace Accounting.Domain.Entities;

// A reusable input shortcut. Invoices always own independent copies of its rows.
public class MealPackage : IHasTimestamps, ISoftDeletable, IHasRowVersion
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<MealPackageLine> Lines { get; set; } = new();
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
public class MealPackageLine
{
    public int Id { get; set; }
    public int MealPackageId { get; set; }
    public int Position { get; set; }
    public int ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public int VatRate { get; set; }
    public decimal DiscountRate { get; set; }
    public int WithholdingRate { get; set; }
}
