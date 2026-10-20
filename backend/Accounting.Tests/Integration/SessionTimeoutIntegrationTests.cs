using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Accounting.Application.Authentication.Common;
using Accounting.Application.Common.Interfaces;
using Accounting.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Accounting.Tests.Integration;

public class SessionTimeoutIntegrationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private async Task<(HttpClient Client, int UserId, JsonElement Login)> LoginAsync()
    {
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(db,
            scope.ServiceProvider.GetRequiredService<IPasswordHasher>(), false, "Invoice.Read");
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var login = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.GetProperty("accessToken").GetString());
        return (client, await db.Users.Where(u => u.Email == email).Select(u => u.Id).SingleAsync(), login);
    }

    private async Task SetTimesAsync(int userId, DateTime started, DateTime lastActivity)
    {
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == userId);
        user.SessionStartedAtUtc = started;
        user.SessionLastActivityAtUtc = lastActivity;
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Login_ReturnsConfigurableDeadlinesAndSessionBoundJwt()
    {
        var (client, _, login) = await LoginAsync();
        using (client)
        {
            var session = login.GetProperty("session");
            var serverTime = session.GetProperty("serverTimeUtc").GetDateTime();
            Assert.InRange((session.GetProperty("absoluteExpiresAtUtc").GetDateTime() - serverTime).TotalSeconds, 86390, 86400);
            Assert.InRange((session.GetProperty("idleExpiresAtUtc").GetDateTime() - serverTime).TotalSeconds, 3590, 3600);
            Assert.Equal(3600, session.GetProperty("idleTimeoutSeconds").GetInt32());
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(login.GetProperty("accessToken").GetString());
            Assert.Equal(session.GetProperty("sessionId").GetString(), jwt.Claims.Single(c => c.Type == "sid").Value);
        }
    }

    [Fact]
    public async Task IdleExpiry_RejectsStillValidAccessTokenAndRefresh()
    {
        var (client, id, _) = await LoginAsync();
        using (client)
        {
            await SetTimesAsync(id, DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1).AddSeconds(-1));
            var response = await client.GetAsync("/api/auth/session");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.Equal("session_expired", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/refresh", new { })).StatusCode);
        }
    }

    [Fact]
    public async Task AbsoluteExpiry_RejectsActiveUserAndCannotBeRevivedByActivity()
    {
        var (client, id, _) = await LoginAsync();
        using (client)
        {
            await SetTimesAsync(id, DateTime.UtcNow.AddDays(-1).AddSeconds(-1), DateTime.UtcNow);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/activity", new { })).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/refresh", new { })).StatusCode);
        }
    }

    [Fact]
    public async Task Refresh_DoesNotExtendAbsoluteOrIdleDeadline_AndCapsCookieAndJwt()
    {
        var (client, id, _) = await LoginAsync();
        using (client)
        {
            var started = DateTime.UtcNow.AddDays(-1).AddMinutes(2);
            var lastActivity = DateTime.UtcNow.AddMinutes(-10);
            await SetTimesAsync(id, started, lastActivity);
            var response = await client.PostAsJsonAsync("/api/auth/refresh", new { });
            response.EnsureSuccessStatusCode();
            var login = await response.Content.ReadFromJsonAsync<JsonElement>();
            var status = login.GetProperty("session");
            Assert.Equal(started.AddDays(1), status.GetProperty("absoluteExpiresAtUtc").GetDateTime());
            Assert.Equal(lastActivity.AddHours(1), status.GetProperty("idleExpiresAtUtc").GetDateTime());
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(login.GetProperty("accessToken").GetString());
            Assert.True(jwt.ValidTo <= started.AddDays(1));
            Assert.Contains("expires=", response.Headers.GetValues("Set-Cookie").Single(), StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task BackgroundRequests_DoNotCountAsActivity_ButExplicitActivityDoes()
    {
        var (client, id, _) = await LoginAsync();
        using (client)
        {
            var started = DateTime.UtcNow.AddHours(-2);
            var lastActivity = DateTime.UtcNow.AddMinutes(-30);
            await SetTimesAsync(id, started, lastActivity);
            (await client.GetAsync("/api/auth/session")).EnsureSuccessStatusCode();
            (await client.GetAsync("/api/license")).EnsureSuccessStatusCode();
            using (var scope = await factory.CreateSeedScopeAsync())
                Assert.Equal(lastActivity, (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.AsNoTracking().SingleAsync(u => u.Id == id)).SessionLastActivityAtUtc);
            (await client.PostAsJsonAsync("/api/auth/activity", new { })).EnsureSuccessStatusCode();
            using var updatedScope = await factory.CreateSeedScopeAsync();
            var user = await updatedScope.ServiceProvider.GetRequiredService<AppDbContext>().Users.AsNoTracking().SingleAsync(u => u.Id == id);
            Assert.True(user.SessionLastActivityAtUtc > lastActivity);
            Assert.Equal(started, user.SessionStartedAtUtc);
        }
    }

    [Fact]
    public async Task Logout_RevokesAccessAndRefreshOnServer()
    {
        var (client, _, _) = await LoginAsync();
        using (client)
        {
            Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/auth/logout", new { })).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/session")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/refresh", new { })).StatusCode);
        }
    }

    [Fact]
    public async Task OptionsOverride_ChangesTimeoutsWithoutCodeChanges()
    {
        using var custom = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.PostConfigure<SessionSettings>(settings => { settings.AbsoluteTimeoutSeconds = 120; settings.IdleTimeoutSeconds = 30; })));
        using var scope = custom.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(db,
            scope.ServiceProvider.GetRequiredService<IPasswordHasher>(), false);
        using var client = custom.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var login = await response.Content.ReadFromJsonAsync<JsonElement>();
        var status = login.GetProperty("session");
        var serverTime = status.GetProperty("serverTimeUtc").GetDateTime();
        Assert.Equal(30, status.GetProperty("idleTimeoutSeconds").GetInt32());
        Assert.InRange((status.GetProperty("absoluteExpiresAtUtc").GetDateTime() - serverTime).TotalSeconds, 115, 120);
    }
}
