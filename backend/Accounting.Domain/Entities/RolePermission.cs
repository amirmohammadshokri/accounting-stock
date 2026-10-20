using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;

public class RolePermission : IHasTimestamps
{
    public int Id { get; set; }
    
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public string Permission { get; set; } = string.Empty; // Örn: "Order.Create"

    // Audit
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}
