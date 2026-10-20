namespace Accounting.Domain.Enums;

public enum OrderStatus
{
    Draft = 1,      // Taslak / Teklif aşaması
    Approved = 2,   // Onaylandı / Sipariş kesinleşti
    Invoiced = 3,   // Faturalandı / Tamamlandı
    Cancelled = 9   // İptal edildi
}
