using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;

public class Unit : IHasTimestamps, ISoftDeletable, IHasRowVersion
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    public ICollection<Item> Items { get; set; } = new List<Item>();
}
