using Accounting.Application.Common.Abstractions;
using Accounting.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Services;

public class ContactBalanceService(IAppDbContext db) : IContactBalanceService
{
    /// <summary>
    /// Belirli bir tarihe kadar olan cari bakiyeyi hesaplar.
    /// Bakiye = (Satış Faturaları - Alış Faturaları) - (Tahsilatlar - Tediyeler)
    /// Pozitif = Müşteri bize borçlu
    /// Negatif = Biz müşteriye borçluyuz
    /// </summary>
    public async Task<decimal> CalculateBalanceAsync(int contactId, DateTime asOfDate, CancellationToken ct = default)
    {
        // Faturalar
        var invoiceTotals = await db.Invoices
            .AsNoTracking()
            .Where(i => i.ContactId == contactId && !i.IsDeleted && i.DateUtc < asOfDate)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                SalesTotal = g.Where(i => (i.Type == InvoiceType.Sales || i.Type == InvoiceType.PurchaseReturn)).Sum(i => (decimal?)i.TotalGross) ?? 0,
                PurchaseTotal = g.Where(i => (i.Type == InvoiceType.Purchase || i.Type == InvoiceType.SalesReturn)).Sum(i => (decimal?)i.TotalGross) ?? 0
            })
            .FirstOrDefaultAsync(ct);

        // Ödemeler
        var paymentTotals = await db.Payments
            .AsNoTracking()
            .Where(p => p.ContactId == contactId && !p.IsDeleted && p.DateUtc < asOfDate)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                InTotal = g.Where(p => p.Direction == PaymentDirection.In).Sum(p => (decimal?)p.Amount) ?? 0,
                OutTotal = g.Where(p => p.Direction == PaymentDirection.Out).Sum(p => (decimal?)p.Amount) ?? 0
            })
            .FirstOrDefaultAsync(ct);

        var salesTotal = invoiceTotals?.SalesTotal ?? 0;
        var purchaseTotal = invoiceTotals?.PurchaseTotal ?? 0;
        var collectionsTotal = paymentTotals?.InTotal ?? 0;  // Tahsilatlar
        var paymentsTotal = paymentTotals?.OutTotal ?? 0;    // Tediyeler

        // Bakiye hesaplama:
        // Satış faturası → Borç artırır (+)
        // Alış faturası → Alacak artırır (-)
        // Tahsilat (In) → Borç azaltır (-)
        // Tediye (Out) → Alacak azaltır (+)
        var balance = (salesTotal - purchaseTotal) - (collectionsTotal - paymentsTotal);

        var opening = await db.ContactOpeningBalances.AsNoTracking()
            .Where(x => x.ContactId == contactId && !x.IsDeleted && x.DateUtc < asOfDate)
            .SumAsync(x => (decimal?)(x.IsDebit ? x.Amount : -x.Amount), ct) ?? 0m;
        return balance + opening;
    }

    /// <summary>
    /// Güncel bakiye (bugüne kadar tüm hareketler)
    /// </summary>
    public Task<decimal> GetCurrentBalanceAsync(int contactId, CancellationToken ct = default)
    {
        return CalculateBalanceAsync(contactId, DateTime.MaxValue, ct);
    }

    /// <summary>
    /// Tarih aralığındaki hareketleri getirir (sıralı)
    /// </summary>
    public async Task<List<ContactTransaction>> GetTransactionsAsync(int contactId, DateTime fromDate, DateTime toDate, CancellationToken ct = default)
    {
        // Faturalar
        var invoices = await db.Invoices
            .AsNoTracking()
            .Where(i => i.ContactId == contactId && !i.IsDeleted && i.DateUtc >= fromDate && i.DateUtc <= toDate)
            .Select(i => new ContactTransaction(
                i.DateUtc,
                i.Type == InvoiceType.Sales ? "فاکتور فروش" :
                i.Type == InvoiceType.Purchase ? "فاکتور خرید" :
                i.Type == InvoiceType.SalesReturn ? "برگشت از فروش" :
                i.Type == InvoiceType.PurchaseReturn ? "برگشت از خرید" : "فاکتور",
                i.InvoiceNumber ?? i.Id.ToString(),
                null,
                i.Type == InvoiceType.Sales || i.Type == InvoiceType.PurchaseReturn ? i.TotalGross : 0,
                i.Type == InvoiceType.Purchase || i.Type == InvoiceType.SalesReturn ? i.TotalGross : 0
            ))
            .ToListAsync(ct);

        // Ödemeler
        var payments = await db.Payments
            .AsNoTracking()
            .Where(p => p.ContactId == contactId && !p.IsDeleted && p.DateUtc >= fromDate && p.DateUtc <= toDate)
            .Select(p => new ContactTransaction(
                p.DateUtc,
                p.Direction == PaymentDirection.In ? "دریافت" : "پرداخت",
                p.Id.ToString(),
                null,
                p.Direction == PaymentDirection.Out ? p.Amount : 0,
                p.Direction == PaymentDirection.In ? p.Amount : 0
            ))
            .ToListAsync(ct);

        // Birleştir ve tarihe göre sırala
        var opening = await db.ContactOpeningBalances.AsNoTracking()
            .Where(x => x.ContactId == contactId && !x.IsDeleted && x.DateUtc >= fromDate && x.DateUtc <= toDate)
            .Select(x => new ContactTransaction(x.DateUtc,"مانده اول دوره",x.Id.ToString(),x.Note,
                x.IsDebit ? x.Amount : 0, x.IsDebit ? 0 : x.Amount)).ToListAsync(ct);
        return invoices.Concat(payments).Concat(opening)
            .OrderBy(t => t.DateUtc)
            .ThenBy(t => t.Type)
            .ToList();
    }
}
