using Accounting.Domain.Entities;

namespace Accounting.Application.Authentication.Common;

public sealed class SessionSettings
{
    public const string SectionName = "SessionSettings";
    public int AbsoluteTimeoutSeconds { get; set; } = 86400;
    public int IdleTimeoutSeconds { get; set; } = 3600;
}

public sealed record SessionStatus(string SessionId, DateTime ServerTimeUtc,
    DateTime AbsoluteExpiresAtUtc, DateTime IdleExpiresAtUtc, int IdleTimeoutSeconds);

public interface ISessionPolicy
{
    DateTime UtcNow { get; }
    void Start(User user);
    bool IsValid(User user);
    DateTime AbsoluteExpiry(User user);
    SessionStatus Status(User user);
}

public interface IUserSessionStore
{
    Task<SessionStatus?> GetAsync(int userId, string sessionId, bool recordActivity, CancellationToken ct);
    Task RevokeAsync(string refreshToken, CancellationToken ct);
}
