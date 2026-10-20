using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Accounting.Api.Middleware;
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
public class DataMaintenanceEndpointsTests
{
    private sealed class CaptureLogger:ILogger<ExceptionToProblemDetailsMiddleware>
    {
        public readonly List<Exception> Errors=new();
        public IDisposable? BeginScope<TState>(TState state) where TState:notnull=>null;
        public bool IsEnabled(LogLevel level)=>true;
        public void Log<TState>(LogLevel level,EventId id,TState state,Exception? error,Func<TState,Exception?,string> formatter){if(error!=null)Errors.Add(error);}
    }
    private sealed class DiagnosticFactory:CustomWebApplicationFactory
    {
        public readonly CaptureLogger Log=new();
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureServices(services=>services.AddSingleton<ILogger<ExceptionToProblemDetailsMiddleware>>(Log));
        }
    }
    [Fact]
    public async Task OrdinaryUser_CannotPreviewOrReset_EvenWithUserManagementPermission()
    {
        using var factory=new DiagnosticFactory();using var scope=await factory.CreateSeedScopeAsync();
        var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();var hasher=scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_,email,password)=await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,true,"User.Read","CompanySettings.Update");
        using var client=factory.CreateClient();
        var response=await client.PostAsJsonAsync("/api/auth/login",new{email,password});var token=await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.Forbidden,(await client.GetAsync("/api/data-maintenance")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,(await client.PostAsJsonAsync("/api/data-maintenance/reset",new{password,confirmation="پاک‌سازی اطلاعات",acknowledge=true})).StatusCode);
    }
    [Fact]
    public async Task Admin_CanPreviewButWrongPasswordNeverStartsDeletion_RevokedAdminIsRejected()
    {
        using var factory=new DiagnosticFactory();using var scope=await factory.CreateSeedScopeAsync();
        var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();var hasher=scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (_,email,password)=await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,true);
        var user=await db.Users.Include(x=>x.UserRoles).ThenInclude(x=>x.Role).SingleAsync(x=>x.Email==email);
        var role=user.UserRoles.Single().Role!;role.Name="مدیر سامانه";await db.SaveChangesAsync();
        using var client=factory.CreateClient();
        var login=await client.PostAsJsonAsync("/api/auth/login",new{email,password});var token=await login.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.OK,(await client.GetAsync("/api/data-maintenance")).StatusCode);
        var response=await client.PostAsJsonAsync("/api/data-maintenance/reset",new{password="Wrong!",confirmation="پاک‌سازی اطلاعات",acknowledge=true});
        Assert.True(response.StatusCode==HttpStatusCode.UnprocessableEntity,string.Join("\n",factory.Log.Errors.Select(x=>x.ToString())));Assert.Single(await db.Users.ToListAsync());
        role.Name="کاربر عادی";await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.Forbidden,(await client.GetAsync("/api/data-maintenance")).StatusCode);
    }
}
