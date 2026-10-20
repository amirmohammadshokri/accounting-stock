namespace Accounting.Domain.Enums;

public enum ChequeStatus
{
    Pending = 1,  // Portföyde / Bekliyor
    Paid = 2,     // Tahsil Edildi / Ödendi
    Endorsed = 3, // Ciro Edildi (Sadece Inbound için)
    Bounced = 4,  // Karşılıksız / Protestolu
    Cancelled = 5 // İptal / İade
}
