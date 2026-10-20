using Accounting.Domain.Common;
namespace Accounting.Domain.Entities;
public class ContactOpeningBalance : IHasBranch, IHasTimestamps, IHasRowVersion, ISoftDeletable
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public DateTime DateUtc { get; set; }
    public string? Note { get; set; }
    public int ContactId { get; set; }
    public decimal Amount { get; set; }
    public bool IsDebit { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
