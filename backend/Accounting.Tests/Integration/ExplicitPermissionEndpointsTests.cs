using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Accounting.Tests.Integration;

public class ExplicitPermissionEndpointsTests
{
    [Theory]
    [InlineData(false, HttpStatusCode.Forbidden)]
    [InlineData(true, HttpStatusCode.OK)]
    public async Task AuditLogs_RequiresAuditRead(bool grantAudit, HttpStatusCode expected)
    {
        using var factory = new CustomWebApplicationFactory();
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(db, hasher, true,
            grantAudit ? "Audit.Read" : "Invoice.Read");
        using var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var token = await login.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.GetProperty("accessToken").GetString());
        Assert.Equal(expected, (await client.GetAsync("/api/audit-logs")).StatusCode);
    }

    [Fact]
    public async Task AdministratorName_WithoutMaintenancePermissions_CannotPreviewOrReset()
    {
        using var factory = new CustomWebApplicationFactory();
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(db, hasher, true, "Invoice.Read");
        var user = await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).SingleAsync(u => u.Email == email);
        user.UserRoles.Single().Role!.Name = "مدیر سامانه";
        await db.SaveChangesAsync();
        using var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var token = await login.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/data-maintenance")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/data-maintenance/reset",
            new { password, confirmation = "پاک‌سازی اطلاعات", acknowledge = true })).StatusCode);
    }
}
