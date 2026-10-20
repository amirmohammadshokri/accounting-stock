using Accounting.Application.Common.Extensions;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Accounting.Tests;

/// <summary>
/// Tests for BranchFilterExtensions to ensure DRY branch filtering works correctly.
/// </summary>
public class BranchFilterExtensionsTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly FakeCurrentUserService _userService;

    public BranchFilterExtensionsTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _userService = new FakeCurrentUserService(branchId: 1);
        var audit = new Accounting.Infrastructure.Persistence.Interceptors.AuditSaveChangesInterceptor(_userService);
        
        _context = new AppDbContext(options, audit, _userService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private async Task SeedDataAsync()
    {
        _context.Invoices.Add(new Invoice 
        { 
            InvoiceNumber = "INV-001", 
            BranchId = 1, 
            ContactId = 1, 
            DateUtc = DateTime.UtcNow, 
            RowVersion = new byte[] { 1 } 
        });
        
        _context.Invoices.Add(new Invoice 
        { 
            InvoiceNumber = "INV-002", 
            BranchId = 2, 
            ContactId = 1, 
            DateUtc = DateTime.UtcNow, 
            RowVersion = new byte[] { 1 } 
        });
        
        _context.Invoices.Add(new Invoice 
        { 
            InvoiceNumber = "INV-003", 
            BranchId = 3, 
            ContactId = 1, 
            DateUtc = DateTime.UtcNow, 
            RowVersion = new byte[] { 1 } 
        });

        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task BranchUser_ShouldOnlySeeOwnBranchData()
    {
        await SeedDataAsync();

        // Regular user (Branch 1)
        var invoices = await _context.Invoices
            .ApplyBranchFilter(_userService)
            .ToListAsync();

        Assert.Single(invoices);
        Assert.Equal("INV-001", invoices[0].InvoiceNumber);
    }

    [Fact]
    public async Task AdminUser_ShouldSeeAllData()
    {
        await SeedDataAsync();

        // Admin user
        _userService.IsAdmin = true;
        
        var invoices = await _context.Invoices
            .ApplyBranchFilter(_userService)
            .ToListAsync();

        Assert.Equal(3, invoices.Count);
    }

    [Fact]
    public async Task HeadquartersUser_ShouldSeeAllData()
    {
        await SeedDataAsync();

        // HQ user
        _userService.IsHeadquarters = true;
        
        var invoices = await _context.Invoices
            .ApplyBranchFilter(_userService)
            .ToListAsync();

        Assert.Equal(3, invoices.Count);
    }

    [Fact]
    public async Task UserWithNoBranch_ShouldSeeNothing()
    {
        await SeedDataAsync();

        // User with no branch assigned
        var userServiceNoBranch = new FakeCurrentUserService(branchId: null);
        
        var invoices = await _context.Invoices
            .ApplyBranchFilter(userServiceNoBranch)
            .ToListAsync();

        Assert.Empty(invoices);
    }
}
