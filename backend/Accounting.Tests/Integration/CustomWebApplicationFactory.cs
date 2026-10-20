using Accounting.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace Accounting.Tests.Integration;

/// <summary>
/// Boots the real Accounting.Api host (real middleware pipeline, real JWT auth, real
/// FluentValidation) against an isolated EF Core InMemory database per instance, so tests
/// can hit actual HTTP endpoints instead of calling handlers directly. This is what caught
/// the invoice-validator and stock-availability bugs that the handler-level unit tests
/// missed (see TASKS.md Faz 2) — validators and middleware only run in the real pipeline.
///
/// Program.cs skips its normal Database.MigrateAsync()/DataSeeder call under the
/// "Testing" environment (InMemory doesn't support relational migrations); this factory
/// calls EnsureCreatedAsync() instead and each test seeds only the data it needs.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    public CustomWebApplicationFactory()
    {
        // Program.cs reads JwtSettings straight off `builder.Configuration` at the top
        // level, before WebApplicationBuilder.Build() runs — which is earlier than
        // WebApplicationFactory's ConfigureAppConfiguration hook is guaranteed to have
        // taken effect for a minimal-hosting-model entry point. Environment variables are
        // read synchronously by WebApplication.CreateBuilder() itself, so setting them
        // here (before any host gets created) is what actually reaches that early check.
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", "Server=unused;Database=unused;");
        Environment.SetEnvironmentVariable("JwtSettings__Secret", "integration-test-only-secret-key-32-characters-min");
        Environment.SetEnvironmentVariable("JwtSettings__Issuer", "AccountingApi");
        Environment.SetEnvironmentVariable("JwtSettings__Audience", "AccountingClient");
        Environment.SetEnvironmentVariable("JwtSettings__AccessTokenExpirationSeconds", "900");
        Environment.SetEnvironmentVariable("JwtSettings__RefreshTokenExpirationSeconds", "604800");
        Environment.SetEnvironmentVariable("Seeding__Enabled", "false");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            // Several handlers open an EF Core transaction (e.g. CreateInvoiceHandler);
            // InMemory doesn't support real transactions and throws unless that specific
            // warning is downgraded — the same ConfigureWarnings every handler-level unit
            // test in this project already applies.
            services.AddDbContext<AppDbContext>(options => options
                .UseInMemoryDatabase(_dbName)
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)));
        });
    }

    /// <summary>Opens a scope against the same InMemory database this factory's host uses,
    /// creating the schema on first call, so tests can seed data before making requests.</summary>
    public async Task<IServiceScope> CreateSeedScopeAsync()
    {
        var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        return scope;
    }
}
