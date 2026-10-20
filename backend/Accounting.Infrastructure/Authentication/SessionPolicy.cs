using Accounting.Application.Authentication.Common;
using Accounting.Domain.Entities;
using Microsoft.Extensions.Options;

namespace Accounting.Infrastructure.Authentication;

public sealed class SessionPolicy(IOptionsMonitor<SessionSettings> settings, TimeProvider clock) : ISessionPolicy
{
    public DateTime UtcNow => clock.GetUtcNow().UtcDateTime;

    public void Start(User user)
    {
        user.SessionId = Guid.NewGuid().ToString("N");
        user.SessionStartedAtUtc = UtcNow;
        user.SessionLastActivityAtUtc = user.SessionStartedAtUtc;
    }

    public DateTime AbsoluteExpiry(User user)
        => DateTime.SpecifyKind(user.SessionStartedAtUtc!.Value, DateTimeKind.Utc)
            .AddSeconds(settings.CurrentValue.AbsoluteTimeoutSeconds);

    public bool IsValid(User user)
        => user.IsActive && !user.IsDeleted && !string.IsNullOrWhiteSpace(user.SessionId)
        && user.SessionStartedAtUtc.HasValue && user.SessionLastActivityAtUtc.HasValue
        && UtcNow < AbsoluteExpiry(user)
        && UtcNow < user.SessionLastActivityAtUtc.Value.AddSeconds(settings.CurrentValue.IdleTimeoutSeconds);

    public SessionStatus Status(User user) => new(user.SessionId!, UtcNow, AbsoluteExpiry(user),
        DateTime.SpecifyKind(user.SessionLastActivityAtUtc!.Value, DateTimeKind.Utc)
            .AddSeconds(settings.CurrentValue.IdleTimeoutSeconds),
        settings.CurrentValue.IdleTimeoutSeconds);
}
