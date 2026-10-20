namespace Accounting.Domain.Enums;

public enum StockMovementType
{
    PurchaseIn = 1,      // Alış / giriş
    SalesOut = 2,        // Satış / çıkış
    AdjustmentIn = 3,    // Sayım fazlası
    AdjustmentOut = 4,   // Sayım eksiği
    SalesReturn = 5,     // Satış iadesi (Giriş)
    PurchaseReturn = 6,   // Alış iadesi (Çıkış)
    TransferOut = 7,     // Transfer çıkışı
    OpeningBalance = 9,
    TransferIn = 8       // Transfer girişi
}
