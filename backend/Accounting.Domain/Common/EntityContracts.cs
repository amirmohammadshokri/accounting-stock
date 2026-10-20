namespace Accounting.Domain.Common;

public interface IHasTimestamps
{
    DateTime CreatedAtUtc { get; set; }
    DateTime? UpdatedAtUtc { get; set; }
}

public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAtUtc { get; set; }
}

public interface IHasRowVersion
{
    byte[] RowVersion { get; set; }
}

public interface IHasBranch
{
    int BranchId { get; set; }
}
