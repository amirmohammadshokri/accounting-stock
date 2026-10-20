namespace Accounting.Application.Services;

public interface IAccountBalanceService
{
    Task<decimal> RecalculateBalanceAsync(int accountId, CancellationToken ct = default);
}
