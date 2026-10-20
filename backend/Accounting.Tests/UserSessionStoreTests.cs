using Accounting.Application.Authentication.Common;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Authentication;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Accounting.Tests;

public sealed class UserSessionStoreTests
{
    [Fact]
    public void SqlServerMigrationScript_AddsSessionColumnsWithoutConnectingToDatabase()
    {
        var current = new FakeCurrentUserService(1);
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=unused;Database=unused;").Options,
            new AuditSaveChangesInterceptor(current), current);
        var script = db.GetService<IMigrator>().GenerateScript("20261018102009_SoftwareLicenseExpiry", "20261020000000_UserSessionTimeouts");
        Assert.Contains("ADD [SessionId] nvarchar(32) NULL", script);
        Assert.Contains("ADD [SessionStartedAtUtc] datetime2 NULL", script);
        Assert.Contains("ADD [SessionLastActivityAtUtc] datetime2 NULL", script);
    }

    [Fact]
    public async Task Sqlite_ActivityAndRevocationUseConditionalSqlUpdates()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var current = new FakeCurrentUserService(1);
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options,
            new AuditSaveChangesInterceptor(current), current);
        await db.Database.EnsureCreatedAsync();
        var settings = new SessionSettings();
        var policy = new SessionPolicy(Mock.Of<IOptionsMonitor<SessionSettings>>(m => m.CurrentValue == settings), TimeProvider.System);
        var user = new User { FirstName = "Session", LastName = "Test", Email = "session@local", PasswordHash = "unused", RefreshToken = "refresh-one" };
        policy.Start(user);
        user.SessionLastActivityAtUtc = DateTime.UtcNow.AddMinutes(-10);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var oldActivity = user.SessionLastActivityAtUtc;
        var sid = user.SessionId!;
        var store = new UserSessionStore(db, policy);
        var initialStatus = await store.GetAsync(user.Id, sid, false, default);
        Assert.NotNull(initialStatus);
        Assert.Equal(DateTimeKind.Utc, initialStatus.AbsoluteExpiresAtUtc.Kind);
        Assert.Equal(DateTimeKind.Utc, initialStatus.IdleExpiresAtUtc.Kind);
        Assert.NotNull(await store.GetAsync(user.Id, sid, true, default));
        await db.Entry(user).ReloadAsync();
        Assert.True(user.SessionLastActivityAtUtc > oldActivity);
        Assert.Null(await store.GetAsync(user.Id, "superseded-session", true, default));
        await store.RevokeAsync("refresh-one", default);
        await db.Entry(user).ReloadAsync();
        Assert.Null(user.SessionId);
        Assert.Null(user.RefreshToken);
        Assert.Null(await store.GetAsync(user.Id, sid, false, default));
    }

    [Fact]
    public void Policy_ExpiresExactlyAtConfiguredBoundary()
    {
        var clock = new ManualClock();
        var settings = new SessionSettings { AbsoluteTimeoutSeconds = 120, IdleTimeoutSeconds = 30 };
        var policy = new SessionPolicy(Mock.Of<IOptionsMonitor<SessionSettings>>(m => m.CurrentValue == settings), clock);
        var user = new User();
        policy.Start(user);
        clock.Now += TimeSpan.FromSeconds(29);
        Assert.True(policy.IsValid(user));
        clock.Now += TimeSpan.FromSeconds(1);
        Assert.False(policy.IsValid(user));
        user.SessionLastActivityAtUtc = clock.Now.UtcDateTime;
        Assert.True(policy.IsValid(user));
        clock.Now += TimeSpan.FromSeconds(90);
        user.SessionLastActivityAtUtc = clock.Now.UtcDateTime;
        Assert.False(policy.IsValid(user));
    }

    private sealed class ManualClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => Now;
    }
}
