using Accounting.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Api.Services;

public sealed record LicenseStatus(DateTime? ExpiresAtUtc, DateTime ServerTimeUtc, bool IsExpired, int? RemainingDays, bool ShowWarning);

public sealed class LicenseService(AppDbContext db, TimeProvider clock)
{
    public async Task<LicenseStatus> GetStatusAsync(CancellationToken cancellationToken)
    {
        // Company settings are global, independent of the user's branch. No token cache:
        // a renewal or expiry applies to existing sessions on their very next request.
        var expiresAt = await db.CompanySettings.AsNoTracking()
            .Where(x => x.LicenseExpiresAtUtc != null)
            .Select(x => x.LicenseExpiresAtUtc).MinAsync(cancellationToken);
        return Evaluate(expiresAt, clock.GetUtcNow().UtcDateTime);
    }

    public static LicenseStatus Evaluate(DateTime? expiresAt, DateTime now)
    {
        var expiry = expiresAt.HasValue ? DateTime.SpecifyKind(expiresAt.Value, DateTimeKind.Utc) : (DateTime?)null;
        var expired = expiry.HasValue && expiry.Value <= now;
        int? remaining = expiry.HasValue ? Math.Max(0, (int)Math.Ceiling((expiry.Value - now).TotalDays)) : null;
        return new(expiry, now, expired, remaining, !expired && remaining is <= 7);
    }
}
