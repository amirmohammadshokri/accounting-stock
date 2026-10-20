using System.Net;
using System.Net.Http.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Accounting.Tests.Integration;

public class AuthEndpointsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthEndpointsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_Endpoint_ShouldNotExist()
    {
        // Regression test for Faz 0: public self-registration was removed entirely —
        // accounts are created by an admin via POST /api/users instead.
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            firstName = "X",
            lastName = "Y",
            email = "someone@test.local",
            password = "Whatever123!"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnAccessToken()
    {
        using var scope = await _factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(
            db, hasher, isHeadquarters: false, "Invoice.Read");

        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponseShape>();
        Assert.False(string.IsNullOrWhiteSpace(body?.accessToken));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldNotReturnOk()
    {
        using var scope = await _factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var (_, email, _) = await IntegrationTestSeeder.SeedBranchUserAsync(
            db, hasher, isHeadquarters: false, "Invoice.Read");

        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "WrongPassword1!" });

        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ShouldReturn401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/branches");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private sealed record LoginResponseShape(int id, string firstName, string lastName, string email, string accessToken);
}
