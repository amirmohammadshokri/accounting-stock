using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;

public class OrderLine : IHasTimestamps, ISoftDeletable
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int? ItemId { get; set; }

    public string Description { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public int VatRate { get; set; } // 0, 1, 10, 20
    public decimal DiscountRate { get; set; }
    public int WithholdingRate { get; set; }
    public decimal Total { get; set; } // Net total (Qty * Price)

    // Audit + Soft Delete
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }

    // Navigations
    public Order Order { get; set; } = null!;
    public Item? Item { get; set; }
}
