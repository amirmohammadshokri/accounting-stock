using Microsoft.EntityFrameworkCore;
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

public class BranchWorkspaceEndpointsTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task DefaultScope_IsSingleBranch_ExplicitAllRequiresPermission(bool viewAll)
    {
        using var factory=new CustomWebApplicationFactory();
        using var scope=await factory.CreateSeedScopeAsync();
        var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher=scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var (branchId,email,password)=await IntegrationTestSeeder.SeedBranchUserAsync(db,hasher,true,
            "Warehouse.Read","Warehouse.Create","Contact.Read", viewAll?"Branch.ViewAll":"Item.Read");
        var other=new Branch {Name="Other",Code="OTHER"};db.Branches.Add(other);
        db.Warehouses.Add(new Warehouse {BranchId=branchId,Name="Own",Code="OWN"});
        db.Warehouses.Add(new Warehouse {Branch=other,Name="Other",Code="OTHER"});
        db.Contacts.Add(new Contact {Branch=other,Name="Shared contact",Code="SHARED"});
        await db.SaveChangesAsync();
        using var client=factory.CreateClient();
        var login=await client.PostAsJsonAsync("/api/auth/login",new {email,password});
        var token=await login.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token.GetProperty("accessToken").GetString());
        var own=await client.GetFromJsonAsync<JsonElement>("/api/warehouses");
        Assert.Single(own.GetProperty("items").EnumerateArray());
        var contacts=await client.GetFromJsonAsync<JsonElement>("/api/contacts");
        Assert.Single(contacts.GetProperty("items").EnumerateArray());
        client.DefaultRequestHeaders.Add("X-Branch-Scope","all");
        var response=await client.GetAsync("/api/warehouses");
        Assert.Equal(viewAll?HttpStatusCode.OK:HttpStatusCode.Forbidden,response.StatusCode);
        if(viewAll) Assert.Equal(2,(await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("items").GetArrayLength());
        client.DefaultRequestHeaders.Remove("X-Branch-Scope");
        client.DefaultRequestHeaders.Add("X-Branch-Id",other.Id.ToString());
        Assert.Equal(viewAll?HttpStatusCode.OK:HttpStatusCode.Forbidden,(await client.GetAsync("/api/warehouses")).StatusCode);
        // Reporting access does not grant permission to write to an unassigned branch.
        Assert.Equal(HttpStatusCode.Forbidden,(await client.PostAsJsonAsync("/api/warehouses",new {name="New",code="NEW",isDefault=false})).StatusCode);
        var user=await db.Users.Include(u=>u.AllowedBranches).SingleAsync(u=>u.Email==email);
        user.AllowedBranches.Add(new UserBranch {BranchId=other.Id});await db.SaveChangesAsync();
        var choices=await client.GetFromJsonAsync<JsonElement>("/api/auth/branches");
        Assert.Equal(2,choices.GetProperty("branches").GetArrayLength());
        Assert.Equal(HttpStatusCode.OK,(await client.GetAsync("/api/warehouses")).StatusCode);
        Assert.Equal(HttpStatusCode.Created,(await client.PostAsJsonAsync("/api/warehouses",new {name="New",code="NEW",isDefault=false})).StatusCode);

    }
}
