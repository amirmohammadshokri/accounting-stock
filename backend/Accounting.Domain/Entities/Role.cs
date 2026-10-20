using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;

public class Role : IHasTimestamps, ISoftDeletable
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsStatic { get; set; } = false; // Sistem tarafından oluşturulan silinemez roller için (örn: Admin)

    // Navigation Properties
    // Permissions artık ayrı bir tablo
    public ICollection<RolePermission> Permissions { get; set; } = new List<RolePermission>();
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    // Audit
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}
