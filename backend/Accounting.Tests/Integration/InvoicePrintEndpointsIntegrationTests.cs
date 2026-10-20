using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Accounting.Tests.Integration;

public class InvoicePrintEndpointsIntegrationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task PdfEndpoint_ReturnsPdf_AndEnforcesBranchAccess()
    {
        using var scope = await factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (branchId, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(db, hasher, false, "Invoice.Read");
        db.CompanySettings.Add(new() { Title = "Test company", TaxNumber = "12345678901234", NationalId = "12345678901", PostalCode = "1234567890", Address = "Tehran" });
        var invoice = new Invoice { BranchId = branchId, InvoiceNumber = "PDF-1", DateUtc = DateTime.UtcNow,
            Contact = new Contact { BranchId = branchId, Name = "Test buyer", Code = "PDF-C1", NationalId = "0987654321", PostalCode = "0987654321", Address = "Isfahan" },
            TotalLineGross = 100, TotalNet = 100, TotalGross = 100, Balance = 100 };
        invoice.Lines.Add(new() { ItemCode = "PDF-ITEM", ItemName = "Test item", Unit = "عدد", Qty = 1, UnitPrice = 100, Gross = 100, Net = 100, GrandTotal = 100 });
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync($"/api/invoices/{invoice.Id}/pdf")).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString());
        var response = await client.GetAsync($"/api/invoices/{invoice.Id}/pdf");
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType!.MediaType);
        Assert.StartsWith("%PDF-", System.Text.Encoding.ASCII.GetString(bytes, 0, 5));
        Assert.True(response.Headers.CacheControl!.NoStore);
        foreach(var format in new[]{"a4-portrait","a5-portrait"}) {
            var sized = await client.GetAsync($"/api/invoices/{invoice.Id}/pdf?format={format}");
            Assert.Equal(HttpStatusCode.OK,sized.StatusCode);
            Assert.Equal("application/pdf",sized.Content.Headers.ContentType!.MediaType);
        }
        Assert.Equal(HttpStatusCode.BadRequest,(await client.GetAsync($"/api/invoices/{invoice.Id}/pdf?format=invalid")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,(await client.GetAsync("/api/invoice-print-layouts/a5-portrait")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,(await client.PutAsJsonAsync("/api/invoice-print-layouts/a5-portrait",new { layout = new {format="a5-portrait"}, version="default" })).StatusCode);
        invoice.BranchId = branchId + 100;
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/invoices/{invoice.Id}/pdf")).StatusCode);
    }
}
