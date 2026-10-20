using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Accounting.Api.Middleware;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
namespace Accounting.Tests.Integration;
public class OpeningBalanceEndpointsTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task OpeningBalanceEndpoints_ValidateAuthorizeAndPersist()
    {
        var diagnostic = new CaptureLogger();
        using var host = factory.WithWebHostBuilder(b => b.ConfigureServices(s => s.AddSingleton<ILogger<ExceptionToProblemDetailsMiddleware>>(diagnostic)));
        using var scope = host.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreatedAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (branch,email,password) = await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,false,
            "Contact.Read","Contact.Update","CompanySettings.Update","Stock.Read","StockMovement.Create");
        var contact = new Contact { BranchId=branch,Name="مشتری",Code="اول" }; db.Contacts.Add(contact); await db.SaveChangesAsync();
        using var client = host.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync("/api/opening-balances/contacts")).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login",new {email,password});
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",(await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString());
        var body = new { contactId=contact.Id,dateUtc=DateTime.UtcNow.Date.AddDays(-1),amount="50000",isDebit=true };
        var created = await client.PostAsJsonAsync("/api/opening-balances/contacts",body);
        Assert.True(created.IsSuccessStatusCode, diagnostic.Error ?? await created.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.UnprocessableEntity,(await client.PostAsJsonAsync("/api/opening-balances/contacts",body)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync("/api/opening-balances/contacts",new {contactId=contact.Id,dateUtc=DateTime.UtcNow.Date,amount=1})).StatusCode);
        var list = await client.GetFromJsonAsync<JsonElement>("/api/opening-balances/contacts?contactId="+contact.Id);
        Assert.Single(list.EnumerateArray());
        var warehouse = new Warehouse { BranchId=branch,Name="انبار اول دوره",Code="اول" };
        var item = new Item { Name="کالای اول دوره",Code="اول",UnitId=1 };
        db.Warehouses.Add(warehouse);db.Items.Add(item);await db.SaveChangesAsync();
        var inventoryBody = new {warehouseId=warehouse.Id,itemId=item.Id,dateUtc=DateTime.UtcNow.Date.AddDays(-1),quantity="10.000",unitCost=(decimal?)null};
        var inventory = await client.PostAsJsonAsync("/api/opening-balances/inventory",inventoryBody);
        Assert.True(inventory.IsSuccessStatusCode,diagnostic.Error ?? await inventory.Content.ReadAsStringAsync());
        Assert.True((await inventory.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("valuationPending").GetBoolean());
        Assert.Equal(HttpStatusCode.UnprocessableEntity,(await client.PostAsJsonAsync("/api/opening-balances/inventory",inventoryBody)).StatusCode);
        var (_,limitedEmail,limitedPassword) = await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,false,"Contact.Read");
        login = await client.PostAsJsonAsync("/api/auth/login",new { email=limitedEmail,password=limitedPassword });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",(await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString());
        Assert.Empty((await client.GetFromJsonAsync<JsonElement>("/api/opening-balances/contacts")).EnumerateArray());
        Assert.Equal(HttpStatusCode.Forbidden,(await client.PostAsJsonAsync("/api/opening-balances/contacts",body)).StatusCode);
    }
}

sealed class CaptureLogger : ILogger<ExceptionToProblemDetailsMiddleware>
{
    public string? Error;
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel level) => true;
    public void Log<TState>(LogLevel level, EventId id, TState state, Exception? ex, Func<TState,Exception?,string> formatter) { if(ex != null) Error=ex.ToString(); }
}
