using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Reports.Queries.Dtos;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Reports.Queries.GetDashboardStats;

public class GetDashboardStatsHandler(IAppDbContext db, ICurrentUserService currentUserService) : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        // IDOR koruması: HQ/Admin olmayan bir kullanıcı, query string'deki branchId'yi
        // değiştirerek başka bir şubenin finansal verilerini göremesin — ApplyBranchFilter'ın
        // diğer tüm liste sorgularında uyguladığı aynı kural (bkz. BranchFilterExtensions).
        int? branchId = currentUserService.AllBranches ? null : currentUserService.BranchId ?? request.BranchId;

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // 1. Daily Sales (Bugünkü Satış Faturaları Toplamı - Brüt)
        var dailySales = await db.Invoices
            .AsNoTracking()
            .Where(i => i.Currency == "IRR" && !i.IsDeleted && (!branchId.HasValue || i.BranchId == branchId.Value) &&
                        i.Type == InvoiceType.Sales &&
                        i.DateUtc >= today && i.DateUtc < tomorrow)
            .SumAsync(i => (decimal?)i.TotalGross, ct) ?? 0m;

        var dailyPurchases = await db.Invoices.AsNoTracking()
            .Where(i => i.Currency == "IRR" && (!branchId.HasValue || i.BranchId == branchId.Value) && i.Type == InvoiceType.Purchase && i.DateUtc >= today && i.DateUtc < tomorrow)
            .SumAsync(i => (decimal?)i.TotalGross, ct) ?? 0m;

        // 2. Daily Collections (Bugünkü Tahsilatlar - Giriş)
        var dailyCollections = await db.Payments
            .AsNoTracking()
            .Where(p => p.Currency == "IRR" && !p.IsDeleted && (!branchId.HasValue || p.BranchId == branchId.Value) &&
                        p.Direction == PaymentDirection.In &&
                        p.DateUtc >= today && p.DateUtc < tomorrow)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        // 3. Total Receivables (Toplam Alacaklar - Satış Faturalarından Kalan)
        var invoices = await db.Invoices.AsNoTracking()
            .Where(x => (!branchId.HasValue || x.BranchId == branchId.Value) && !x.IsDeleted && x.Currency == "IRR")
            .GroupBy(x => x.ContactId).Select(g => new { Id = g.Key,
                Amount = g.Sum(x => x.Type == InvoiceType.Sales || x.Type == InvoiceType.PurchaseReturn ? x.TotalGross : -x.TotalGross) }).ToListAsync(ct);
        var payments = await db.Payments.AsNoTracking().Where(x => x.ContactId.HasValue)
            .Where(x => (!branchId.HasValue || x.BranchId == branchId.Value) && !x.IsDeleted && x.Currency == "IRR")
            .GroupBy(x => x.ContactId).Select(g => new { Id = g.Key!.Value,
                Amount = g.Sum(x => x.Direction == PaymentDirection.Out ? x.Amount : -x.Amount) }).ToListAsync(ct);
        var openings = await db.ContactOpeningBalances.AsNoTracking().Where(x => (!branchId.HasValue || x.BranchId == branchId.Value) && !x.IsDeleted && x.DateUtc <= DateTime.UtcNow)
            .Select(x => new { Id = x.ContactId, Amount = x.IsDebit ? x.Amount : -x.Amount }).ToListAsync(ct);
        var balances = invoices.Concat(payments).Concat(openings).GroupBy(x => x.Id).Select(g => g.Sum(x => x.Amount)).ToList();
        var receivables = balances.Where(x => x > 0).Sum();
        var payables = -balances.Where(x => x < 0).Sum();

        // 5. Cash/Bank Status
        var accounts = await db.CashBankAccounts
            .AsNoTracking()
            .Where(a => (!branchId.HasValue || a.BranchId == branchId.Value))
            .Select(a => new CashStatusDto(
                a.Id,
                a.Name,
                a.Type == CashBankAccountType.Cash ? "Kasa" : "Banka",
                a.Balance,
                a.Currency // Preserve the currency of historical accounts.
            ))
            .ToListAsync(ct);

        return new DashboardStatsDto(
            dailySales,
            dailyCollections,
            receivables,
            payables,
            accounts
        ) { DailyPurchasesTotal = dailyPurchases };
    }
}
