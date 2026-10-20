namespace Accounting.Application.Services;

/// <summary>
/// Cari hesap bakiye hesaplama servisi.
/// Cari ekstre ve bakiye sorgulama işlemleri için kullanılır.
/// </summary>
public interface IContactBalanceService
{
    /// <summary>
    /// Belirli bir tarihe kadar olan cari bakiyeyi hesaplar.
    /// </summary>
    /// <param name="contactId">Cari ID</param>
    /// <param name="asOfDate">Bu tarihe kadar (exclusive)</param>
    /// <returns>Bakiye (pozitif = borçlu, negatif = alacaklı)</returns>
    Task<decimal> CalculateBalanceAsync(int contactId, DateTime asOfDate, CancellationToken ct = default);

    /// <summary>
    /// Güncel cari bakiyeyi hesaplar.
    /// </summary>
    Task<decimal> GetCurrentBalanceAsync(int contactId, CancellationToken ct = default);

    /// <summary>
    /// Belirli tarih aralığındaki cari hareketleri getirir.
    /// </summary>
    Task<List<ContactTransaction>> GetTransactionsAsync(int contactId, DateTime fromDate, DateTime toDate, CancellationToken ct = default);
}

/// <summary>
/// Cari hesap hareketi (fatura veya ödeme)
/// </summary>
public record ContactTransaction(
    DateTime DateUtc,
    string Type,        // "Satış Faturası", "Alış Faturası", "Tahsilat", "Ödeme"
    string DocNo,
    string? Description,
    decimal Debt,       // Borç (müşterinin bize borcu artar)
    decimal Credit      // Alacak (müşterinin bize borcu azalır)
);
