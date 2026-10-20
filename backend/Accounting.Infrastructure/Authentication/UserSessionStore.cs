using Accounting.Application.Authentication.Common;
using Accounting.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Infrastructure.Authentication;

public sealed class UserSessionStore(AppDbContext db, ISessionPolicy policy) : IUserSessionStore
{
    public async Task<SessionStatus?> GetAsync(int userId, string sessionId, bool recordActivity, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId && u.SessionId == sessionId, ct);
        if (user is null || !policy.IsValid(user)) return null;
        if (recordActivity)
        {
            var now = policy.UtcNow;
            var query = db.Users.Where(u => u.Id == userId && u.SessionId == sessionId && u.IsActive);
            if (db.Database.IsRelational())
            {
                // Conditional update prevents an old tab from writing over a newer login.
                if (await query.ExecuteUpdateAsync(setters => setters
                    .SetProperty(u => u.SessionLastActivityAtUtc,
                        u => u.SessionLastActivityAtUtc > now ? u.SessionLastActivityAtUtc : now), ct) == 0) return null;
            }
            else
            {
                var tracked = await query.FirstOrDefaultAsync(ct);
                if (tracked is null) return null;
                if (tracked.SessionLastActivityAtUtc < now) tracked.SessionLastActivityAtUtc = now;
                await db.SaveChangesAsync(ct);
            }
            user.SessionLastActivityAtUtc = now;
        }
        return policy.Status(user);
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;
        var query = db.Users.Where(u => u.RefreshToken == refreshToken);
        if (db.Database.IsRelational())
        {
            await query.ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.SessionId, (string?)null)
                .SetProperty(u => u.SessionStartedAtUtc, (DateTime?)null)
                .SetProperty(u => u.SessionLastActivityAtUtc, (DateTime?)null)
                .SetProperty(u => u.RefreshToken, (string?)null)
                .SetProperty(u => u.RefreshTokenExpiryTime, (DateTime?)null), ct);
        }
        else
        {
            var user = await query.FirstOrDefaultAsync(ct);
            if (user is null) return;
            user.SessionId = null; user.SessionStartedAtUtc = null; user.SessionLastActivityAtUtc = null;
            user.RefreshToken = null; user.RefreshTokenExpiryTime = null;
            await db.SaveChangesAsync(ct);
        }
    }
}
