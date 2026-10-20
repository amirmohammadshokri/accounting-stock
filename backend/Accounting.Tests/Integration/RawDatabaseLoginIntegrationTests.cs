using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Accounting.Tests.Integration;

public sealed class RawDatabaseLoginIntegrationTests
{
    [Fact]
    public async Task RawSeed_AdminCanLoginAndReadInitialSettings_WithoutDemoTransactions()
    {
        using var factory = new CustomWebApplicationFactory();
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        const string password = "InitialAdmin1405!";
        await StartupDataSeeder.SeedEssentialAsync(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher>(), password);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email = "admin@demo.local", password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var login = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("مدیر", login.GetProperty("firstName").GetString());
        Assert.True(login.GetProperty("session").GetProperty("idleTimeoutSeconds").GetInt32() > 0);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/company-settings")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/users")).StatusCode);
        Assert.Empty(await db.Contacts.ToListAsync());
        Assert.Empty(await db.Items.ToListAsync());
        Assert.Empty(await db.Invoices.ToListAsync());
        Assert.Empty(await db.Orders.ToListAsync());
        Assert.Empty(await db.Payments.ToListAsync());
    }
}
