using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;


public class AuditTrail
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? Action { get; set; }    // "Insert", "Update", "Delete", "SoftDelete"
    public string? EntityName { get; set; }
    public string? PrimaryKey { get; set; }
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public DateTime TimestampUtc { get; set; }
}
