using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Accounting.Tests.Integration;

/// <summary>
/// Regression coverage for a real bug found via manual API testing: CreateItemCommand and
/// UpdateItemCommand declared their Type field as plain `int` instead of the ItemType enum,
/// while both validators called `.IsInEnum()` on it. FluentValidation's IsInEnum() only
/// makes sense against an actual enum type — applied to `int`, it always failed, so
/// POST/PUT /api/items rejected every request regardless of the value sent. No unit test
/// caught this because the handler-level tests call CreateItemHandler directly and never
/// go through the FluentValidation pipeline (only the real MediatR/HTTP pipeline runs
/// ValidationBehavior), which is exactly why this needs to be an HTTP-level test.
/// </summary>
public class ItemEndpointsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ItemEndpointsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateItem_WithValidInventoryType_ShouldReturn200()
    {
        using var scope = await _factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(
            db, hasher, isHeadquarters: false, "Item.Create");

        var unit = new Accounting.Domain.Entities.Unit { Name = "adet" };
        db.Units.Add(unit);
        await db.SaveChangesAsync();

        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        loginResponse.EnsureSuccessStatusCode();
        var token = (await loginResponse.Content.ReadFromJsonAsync<LoginResponseShape>())!.accessToken;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/items", new
        {
            categoryId = (int?)null,
            code = "IT-INTEGRATION-1",
            name = "Integration Test Item",
            type = 1, // ItemType.Inventory
            unitId = unit.Id,
            vatRate = 20,
            defaultWithholdingRate = (int?)null,
            purchasePrice = "50.00",
            salesPrice = "75.00",
            purchaseAccountCode = (string?)null,
            salesAccountCode = (string?)null,
            usefulLifeYears = (int?)null
        });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.Created, $"Expected 201, got {response.StatusCode}: {body}");
        Assert.Contains("\"code\":\"IT-INTEGRATION-1\"", body);
    }

    private sealed record LoginResponseShape(int id, string firstName, string lastName, string email, string accessToken);
}
