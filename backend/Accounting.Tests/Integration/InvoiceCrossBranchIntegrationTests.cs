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
/// Regression coverage for a real bug found via manual UI testing: creating/updating an
/// invoice for a contact belonging to a different branch than the caller's own always
/// failed validation, even for a Headquarters user — because
/// CreateInvoiceValidator/UpdateInvoiceValidator's ContactBelongsToSameBranchAsync compared
/// the contact's branch directly against the caller's own branch with no admin/HQ bypass,
/// unlike ApplyBranchFilter (used everywhere else in the codebase), which always lets
/// Admin/HQ users see and act on every branch. In practice this meant an HQ/admin account
/// could never invoice a contact outside its own "home" branch — the exact scenario a
/// head-office user needs most.
/// </summary>
public class InvoiceCrossBranchIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public InvoiceCrossBranchIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateInvoice_ForContactInAnotherBranch_ShouldSucceed_WhenCallerIsHeadquarters()
    {
        using var scope = await _factory.CreateSeedScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        // HQ user (isHeadquarters: true) — should be able to act on any branch.
        var (_, email, password) = await IntegrationTestSeeder.SeedBranchUserAsync(
            db, hasher, isHeadquarters: true, "Invoice.Create");

        // A contact that belongs to a *different*, non-HQ branch.
        var otherBranch = new Branch { Name = "Other Branch", Code = "OTHER-INV" };
        db.Branches.Add(otherBranch);
        var contact = new Contact { Branch = otherBranch, Name = "Other Branch Customer", Code = "OBC-1", IsCustomer = true };
        db.Contacts.Add(contact);
        // Service type: no stock/warehouse involved, keeps this test focused purely on
        // the cross-branch contact validation bug rather than also needing a warehouse.
        var item = new Item { Unit = new Accounting.Domain.Entities.Unit { Name = "adet" }, Name = "Test Item", Code = "CROSS-1", Type = Accounting.Domain.Enums.ItemType.Service };
        db.Items.Add(item);
        await db.SaveChangesAsync();

        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        loginResponse.EnsureSuccessStatusCode();
        var token = (await loginResponse.Content.ReadFromJsonAsync<LoginResponseShape>())!.accessToken;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/invoices", new
        {
            contactId = contact.Id,
            dateUtc = DateTime.UtcNow,
            currency = "IRR",
            type = 2, // Purchase (no pre-existing stock required, unlike Sales)
            lines = new[]
            {
                new { id = 0, itemId = item.Id, qty = "1", unitPrice = "10.00", vatRate = 0 }
            }
        });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.Created, $"Expected 201, got {response.StatusCode}: {body}");
    }

    private sealed record LoginResponseShape(int id, string firstName, string lastName, string email, string accessToken);
}
