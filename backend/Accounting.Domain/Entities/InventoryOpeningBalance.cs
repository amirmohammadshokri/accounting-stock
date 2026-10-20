using Accounting.Domain.Common;
namespace Accounting.Domain.Entities;
public class InventoryOpeningBalance : IHasBranch, IHasTimestamps, IHasRowVersion, ISoftDeletable
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public DateTime DateUtc { get; set; }
    public string? Note { get; set; }
    public int WarehouseId { get; set; }
    public int ItemId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public int? StockMovementId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
