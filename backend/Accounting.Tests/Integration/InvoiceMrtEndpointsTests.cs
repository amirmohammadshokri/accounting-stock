using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
namespace Accounting.Tests.Integration;
public class InvoiceMrtEndpointsTests
{
    [Fact]
    public async Task Designer_LoadsSavesPrintsAndRestoresMrt_EnforcesPermissionsAndBranchVisibility()
    {
        var root=Path.Combine(Path.GetTempPath(),"mrt-api-tests-"+Guid.NewGuid());
        try
        {
            using var baseFactory=new CustomWebApplicationFactory();
            using var factory=baseFactory.WithWebHostBuilder(builder=>builder.ConfigureAppConfiguration((_,config)=>config.AddInMemoryCollection(new Dictionary<string,string?>{["InvoicePrinting:MrtDirectory"]=root,["InvoicePrinting:LayoutDirectory"]=Path.Combine(root,"layouts")})));
            using var scope=factory.Services.CreateScope();var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();await db.Database.EnsureCreatedAsync();
            var hasher=scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            var (branch,email,password)=await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,false,"CompanySettings.Read","CompanySettings.Update","Invoice.Read");
            var invoice=new Invoice{BranchId=branch,InvoiceNumber="MRT-1",DateUtc=DateTime.UtcNow,Contact=new Contact{Code="MRT-C1",Name="مشتری",BranchId=branch}};
            invoice.Lines.Add(new InvoiceLine{ItemCode="FOOD",ItemName="غذای نمونه",Unit="پرس",Qty=1,UnitPrice=100});db.Invoices.Add(invoice);await db.SaveChangesAsync();
            using var client=factory.CreateClient();
            Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync("/api/invoice-mrt/a4-portrait")).StatusCode);
            await Login(client,email,password);
            var initial=await client.GetFromJsonAsync<JsonElement>("/api/invoice-mrt/a4-portrait");
            Assert.Equal("default",initial.GetProperty("version").GetString());
            var template=initial.GetProperty("template").GetString()!.Replace("{Invoice.CustomTitle}","CUSTOM-MRT");
            Assert.Contains("CUSTOM-MRT",template);
            var savedResponse=await client.PutAsJsonAsync("/api/invoice-mrt/a4-portrait",new{template,version="default"});savedResponse.EnsureSuccessStatusCode();
            var saved=await savedResponse.Content.ReadFromJsonAsync<JsonElement>();var version=saved.GetProperty("version").GetString();
            var loaded=await client.GetFromJsonAsync<JsonElement>("/api/invoice-mrt/a4-portrait");Assert.True(loaded.GetProperty("isCustom").GetBoolean());Assert.Contains("CUSTOM-MRT",loaded.GetProperty("template").GetString());
            Assert.Equal("default",(await client.GetFromJsonAsync<JsonElement>("/api/invoice-mrt/a5-portrait")).GetProperty("version").GetString());
            Assert.Equal(HttpStatusCode.Conflict,(await client.PutAsJsonAsync("/api/invoice-mrt/a4-portrait",new{template,version="default"})).StatusCode);
            var samplePdf=await client.PostAsJsonAsync("/api/invoice-mrt/a4-portrait/preview",new{template});samplePdf.EnsureSuccessStatusCode();Assert.Equal("application/pdf",samplePdf.Content.Headers.ContentType!.MediaType);
            var pdf=await client.GetAsync($"/api/invoices/{invoice.Id}/pdf?format=a4-portrait");pdf.EnsureSuccessStatusCode();Assert.Equal("application/pdf",pdf.Content.Headers.ContentType!.MediaType);
            var preview=await client.PostAsJsonAsync($"/api/invoice-mrt/a4-portrait/preview/{invoice.Id}",new{template});preview.EnsureSuccessStatusCode();Assert.Equal("application/pdf",preview.Content.Headers.ContentType!.MediaType);
            invoice.BranchId=branch+100;await db.SaveChangesAsync();Assert.Equal(HttpStatusCode.NotFound,(await client.GetAsync($"/api/invoice-mrt/a4-portrait?invoiceId={invoice.Id}")).StatusCode);
            var restored=await client.PostAsJsonAsync("/api/invoice-mrt/a4-portrait/restore",new{version});Assert.Equal(HttpStatusCode.NoContent,restored.StatusCode);
            var (_,otherEmail,otherPassword)=await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,false,"Invoice.Read");await Login(client,otherEmail,otherPassword);
            Assert.Equal(HttpStatusCode.Forbidden,(await client.GetAsync("/api/invoice-mrt/a4-portrait")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden,(await client.PutAsJsonAsync("/api/invoice-mrt/a4-portrait",new{template,version="default"})).StatusCode);
        }
        finally{if(Directory.Exists(root))Directory.Delete(root,true);}
    }
    private static async Task Login(HttpClient client,string email,string password)
    {
        var login=await client.PostAsJsonAsync("/api/auth/login",new{email,password});login.EnsureSuccessStatusCode();
        client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",(await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString());
    }
}
