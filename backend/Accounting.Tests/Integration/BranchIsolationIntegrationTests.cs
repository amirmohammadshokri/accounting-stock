using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Accounting.Tests.Integration;

/// <summary>
/// Regression coverage for the Faz 0 fix: GetStockByIdHandler and
/// GetStockMovementByIdHandler were missing .ApplyBranchFilter(), so any authenticated
/// user with Stock.Read could read another branch's stock/stock-movement records by
/// guessing/incrementing the numeric id (IDOR). These tests log in as a real branch-scoped
/// (non-admin, non-headquarters) user and hit the real HTTP endpoints, which is the layer
/// the bug actually lived at — the handler-level unit tests never exercised branch
/// filtering end-to-end through a real JWT.
/// </summary>
public class BranchIsolationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public BranchIsolationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetStockById_ForAnotherBranch_ShouldReturn404()
    {
        using var scope = await _factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        // A non-admin, non-headquarters user in "their own" branch...
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(
            db, hasher, isHeadquarters: false, "Stock.Read");

        // ...and a Stock row that belongs to a completely different branch.
        var otherBranch = new Branch { Name = "Other Branch", Code = "OTHER" };
        db.Branches.Add(otherBranch);
        var warehouse = new Warehouse { Branch = otherBranch, Code = "WH-OTHER", Name = "Other WH", IsDefault = true, RowVersion = [] };
        db.Warehouses.Add(warehouse);
        var item = new Item { Name = "Secret Item", Code = "SECRET-1" };
        db.Items.Add(item);
        var otherBranchStock = new Stock { Branch = otherBranch, Warehouse = warehouse, Item = item, Quantity = 100m, RowVersion = [] };
        db.Stocks.Add(otherBranchStock);
        await db.SaveChangesAsync();

        var client = _factory.CreateClient();
        var token = await LoginAsync(client, email, password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync($"/api/stocks/{otherBranchStock.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetStockMovementById_ForAnotherBranch_ShouldReturn404()
    {
        using var scope = await _factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(
            db, hasher, isHeadquarters: false, "StockMovement.Read");

        var otherBranch = new Branch { Name = "Other Branch", Code = "OTHER" };
        db.Branches.Add(otherBranch);
        var warehouse = new Warehouse { Branch = otherBranch, Code = "WH-OTHER", Name = "Other WH", IsDefault = true, RowVersion = [] };
        db.Warehouses.Add(warehouse);
        var item = new Item { Name = "Secret Item", Code = "SECRET-2" };
        db.Items.Add(item);
        var otherBranchMovement = new StockMovement
        {
            Branch = otherBranch,
            Warehouse = warehouse,
            Item = item,
            Type = Accounting.Domain.Enums.StockMovementType.AdjustmentIn,
            Quantity = 10m,
            TransactionDateUtc = DateTime.UtcNow,
            RowVersion = []
        };
        db.StockMovements.Add(otherBranchMovement);
        await db.SaveChangesAsync();

        var client = _factory.CreateClient();
        var token = await LoginAsync(client, email, password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync($"/api/stockmovements/{otherBranchMovement.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<LoginResponseShape>();
        return body!.accessToken;
    }

    private sealed record LoginResponseShape(int id, string firstName, string lastName, string email, string accessToken);
}
