using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;

public class UserRole : IHasTimestamps
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }

    public int RoleId { get; set; }
    public Role? Role { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}
