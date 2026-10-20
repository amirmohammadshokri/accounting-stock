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

public class UnitEndpointsIntegrationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task UnitEndpoints_CompleteCrudThroughHttpPipeline()
    {
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(db, hasher, false,
            "Unit.Create", "Unit.Read", "Unit.Update", "Unit.Delete");
        using var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var loginJson = await login.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginJson.GetProperty("accessToken").GetString());
        var name = "kg-" + Guid.NewGuid().ToString("N")[..8];
        var created = await client.PostAsJsonAsync("/api/units", new { name, description = "Weight" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.NotNull(created.Headers.Location);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
        var detail = await client.GetAsync($"/api/units/{id}");
        Assert.Equal(HttpStatusCode.OK, detail.StatusCode);
        var list = await client.GetFromJsonAsync<JsonElement>($"/api/units?search={name}&page=0&pageSize=1000");
        Assert.Equal(1, list.GetProperty("total").GetInt32());
        Assert.Equal(1, list.GetProperty("pageNumber").GetInt32());
        Assert.Equal(100, list.GetProperty("pageSize").GetInt32());

        // The InMemory provider does not generate SQL Server rowversions.
        var entity = await db.Units.SingleAsync(x => x.Id == id);
        entity.RowVersion = new byte[] { 1 };
        await db.SaveChangesAsync();
        var update = await client.PutAsJsonAsync($"/api/units/{id}", new { id, name, description = "Updated", rowVersion = "AQ==" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        Assert.Equal("Updated", (await update.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("description").GetString());
        var deleted = await client.DeleteAsync($"/api/units/{id}?rowVersion=AQ%3D%3D");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/units/{id}")).StatusCode);
    }

    [Fact]
    public async Task UnitEndpoints_RequireAuthenticationAndUnitPermission()
    {
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/units")).StatusCode);
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(db, hasher, false, "Item.Read");
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        var loginJson = await login.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginJson.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/units")).StatusCode);
    }
}
