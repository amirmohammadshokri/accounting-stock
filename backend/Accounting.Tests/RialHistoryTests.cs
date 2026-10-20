using Accounting.Application.Reports.Queries.GetDashboardStats;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;

namespace Accounting.Tests;

public class RialHistoryTests
{
    [Fact]
    public async Task HistoricalForeignCurrency_RemainsEditable_ButCannotBeRelabeled()
    {
        var root = new InMemoryDatabaseRoot();
        var name = Guid.NewGuid().ToString();
        var user = new FakeCurrentUserService(1);
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name, root).ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options;
        using var db = new AppDbContext(options, new AuditSaveChangesInterceptor(user), user);
        // Simulate data saved before rial-only validation was introduced.
        using (var historical = new DbContext(new DbContextOptionsBuilder().UseInMemoryDatabase(name, root).UseModel(db.Model).Options))
        {
            historical.Add(new CashBankAccount { Id = 1, BranchId = 1, Code = "OLD", Name = "Old account", Currency = "USD", Balance = 50m, RowVersion = [] });
            await historical.SaveChangesAsync();
        }
        var account = await db.CashBankAccounts.SingleAsync();
        account.Name = "Updated name";
        await db.SaveChangesAsync();
        Assert.Equal("USD", account.Currency);
        Assert.Equal(50m, account.Balance);
        account.Currency = "IRR";
        await Assert.ThrowsAsync<ValidationException>(() => db.SaveChangesAsync());
    }
    [Fact]
    public async Task Dashboard_SumsOnlyRial_AndKeepsHistoricalAccountCurrency()
    {
        var root = new InMemoryDatabaseRoot();
        var name = Guid.NewGuid().ToString();
        var user = new FakeCurrentUserService(1);
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name, root).Options, new AuditSaveChangesInterceptor(user), user);
        using (var historical = new DbContext(new DbContextOptionsBuilder().UseInMemoryDatabase(name, root).UseModel(db.Model).Options))
        {
            historical.Add(new Invoice { Id = 1, BranchId = 1, InvoiceNumber = "OLD", Type = InvoiceType.Sales, Currency = "USD", TotalGross = 1000m, Balance = 1000m, DateUtc = DateTime.UtcNow, RowVersion = [] });
            historical.Add(new Invoice { Id = 2, BranchId = 1, InvoiceNumber = "RIAL", Type = InvoiceType.Sales, Currency = "IRR", TotalGross = 200m, Balance = 200m, DateUtc = DateTime.UtcNow, RowVersion = [] });
            historical.Add(new Payment { Id = 1, BranchId = 1, Currency = "USD", Direction = PaymentDirection.In, Amount = 500m, DateUtc = DateTime.UtcNow, RowVersion = [] });
            historical.Add(new Payment { Id = 2, BranchId = 1, Currency = "IRR", Direction = PaymentDirection.In, Amount = 75m, DateUtc = DateTime.UtcNow, RowVersion = [] });
            historical.Add(new CashBankAccount { Id = 1, BranchId = 1, Code = "OLD", Name = "Old account", Currency = "USD", Balance = 50m, RowVersion = [] });
            await historical.SaveChangesAsync();
        }
        var result = await new GetDashboardStatsHandler(db, user).Handle(new GetDashboardStatsQuery(1), CancellationToken.None);
        Assert.Equal(200m, result.DailySalesTotal);
        Assert.Equal(75m, result.DailyCollectionsTotal);
        Assert.Equal(200m, result.TotalReceivables);
        Assert.Equal("USD", Assert.Single(result.CashStatus).Currency);
    }
}
