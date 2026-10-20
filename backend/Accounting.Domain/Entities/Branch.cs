using Accounting.Domain.Common;

namespace Accounting.Domain.Entities;

public class Branch : IHasTimestamps, ISoftDeletable, IHasRowVersion
{
    public int Id { get; set; }

    /// <summary>
    /// Şube kodu (örn: MERKEZ, ANKARA, IZMIR)
    /// </summary>
    public string Code { get; set; } = null!;

    /// <summary>
    /// Şube adı (örn: Merkez Şube, Ankara Şubesi)
    /// </summary>
    public string Name { get; set; } = null!;

    public string? LogoDataUrl { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }

    public bool IsHeadquarters { get; set; }

    // IHasTimestamps
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }

    // IHasRowVersion
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // İleride navigation’lar (Contacts, Invoices vs.) buraya eklenebilir
}
