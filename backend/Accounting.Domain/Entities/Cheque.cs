using Accounting.Domain.Common;
using Accounting.Domain.Enums;

namespace Accounting.Domain.Entities;

public class Cheque : IHasTimestamps, ISoftDeletable, IHasRowVersion, IHasBranch
{
    public int Id { get; set; }
    public int BranchId { get; set; }

    public int? ContactId { get; set; } // Kimden alındı / Kime verildi

    public ChequeType Type { get; set; }
    public ChequeDirection Direction { get; set; }
    public ChequeStatus Status { get; set; } = ChequeStatus.Pending;

    public string ChequeNumber { get; set; } = null!; // Çek/Senet No
    
    public DateTime IssueDate { get; set; } // Düzenleme Tarihi (Keşide)
    public DateTime DueDate { get; set; }   // Vade Tarihi

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "IRR";

    // Banka Bilgileri (Özellikle alınan çekler için)
    public string? BankName { get; set; }
    public string? BankBranch { get; set; }
    public string? AccountNumber { get; set; }
    public string? DrawerName { get; set; } // Keşideci (Çeki yazan kişi/firma)

    public string? Description { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigations
    public Branch Branch { get; set; } = null!;
    public Contact? Contact { get; set; }
}
