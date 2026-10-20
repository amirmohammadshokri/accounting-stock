using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Accounting.Api.Services;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Accounting.Tests.Integration;

public class LicenseEndpointsTests
{
    [Theory]
    [InlineData(-1, true, 0, false)]
    [InlineData(0, true, 0, false)]
    [InlineData(1, false, 1, true)]
    [InlineData(7 * 86400, false, 7, true)]
    [InlineData(7 * 86400 + 1, false, 8, false)]
    [InlineData(50 * 86400, false, 50, false)]
    public void ExpiryBoundary_UsesUtcAndRoundsRemainingDays(int seconds, bool expired, int days, bool warning)
    {
        var now=new DateTime(2026,10,18,0,0,0,DateTimeKind.Utc);
        var result=LicenseService.Evaluate(now.AddSeconds(seconds),now);
        Assert.Equal(expired,result.IsExpired);
        Assert.Equal(days,result.RemainingDays);
        Assert.Equal(warning,result.ShowWarning);
    }

    [Fact]
    public void NullExpiry_IsUnlimited()
    {
        var result=LicenseService.Evaluate(null,DateTime.UtcNow);
        Assert.False(result.IsExpired); Assert.Null(result.RemainingDays); Assert.False(result.ShowWarning);
    }

    [Fact]
    public async Task Expiry_BlocksLoginRefreshAndExistingToken_RenewalRestoresSameSession()
    {
        using var factory=new CustomWebApplicationFactory();
        using var scope=await factory.CreateSeedScopeAsync();
        var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher=scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_,email,password)=await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,true,"Branch.Read");
        var settings=new CompanySettings{Title="Test",LicenseExpiresAtUtc=DateTime.UtcNow.AddDays(50)};
        db.CompanySettings.Add(settings); await db.SaveChangesAsync();
        using var client=factory.CreateClient();
        var login=await client.PostAsJsonAsync("/api/auth/login",new {email,password});
        login.EnsureSuccessStatusCode();
        var result=await login.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",result.GetProperty("accessToken").GetString());
        settings.LicenseExpiresAtUtc=DateTime.UtcNow.AddSeconds(-1); await db.SaveChangesAsync();
        foreach(var response in new[]{await client.GetAsync("/api/branches"),await client.PostAsJsonAsync("/api/auth/login",new{email,password}),await client.PostAsync("/api/auth/refresh",null)})
        {
            Assert.Equal(HttpStatusCode.Forbidden,response.StatusCode);
            Assert.Contains("license_expired",await response.Content.ReadAsStringAsync());
        }
        var status=await client.GetFromJsonAsync<LicenseStatus>("/api/license");
        Assert.True(status!.IsExpired);
        settings.LicenseExpiresAtUtc=DateTime.UtcNow.AddDays(50); await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.OK,(await client.GetAsync("/api/branches")).StatusCode);
        Assert.Equal(HttpStatusCode.MethodNotAllowed,(await client.PostAsJsonAsync("/api/license",new{expiresAtUtc=DateTime.UtcNow.AddYears(10)})).StatusCode);
    }

    [Fact]
    public async Task CompanySettingsUpdate_CannotChangeOwnerExpiry_EvenWithExtraJsonProperty()
    {
        using var factory=new CustomWebApplicationFactory();
        using var scope=await factory.CreateSeedScopeAsync();
        var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher=scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_,email,password)=await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,true,"CompanySettings.Update");
        var expiry=DateTime.UtcNow.AddDays(50);
        var settings=new CompanySettings{Title="Test",LicenseExpiresAtUtc=expiry};
        db.CompanySettings.Add(settings);await db.SaveChangesAsync();
        using var client=factory.CreateClient();
        var login=await client.PostAsJsonAsync("/api/auth/login",new{email,password});
        var token=await login.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token.GetProperty("accessToken").GetString());
        var response=await client.PutAsJsonAsync("/api/company-settings",new{id=settings.Id,title="Updated",taxNumber="123",licenseExpiresAtUtc=DateTime.UtcNow.AddYears(99)});
        response.EnsureSuccessStatusCode();
        await db.Entry(settings).ReloadAsync();
        Assert.Equal(expiry,settings.LicenseExpiresAtUtc);
        Assert.Equal("Updated",settings.Title);
    }
}
