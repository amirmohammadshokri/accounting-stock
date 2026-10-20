using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;

public class Category : IHasTimestamps, ISoftDeletable, IHasRowVersion
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Color { get; set; } // Hex code for UI (e.g., #FF0000)

    // audit + soft delete + concurrency
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = null!;
}
