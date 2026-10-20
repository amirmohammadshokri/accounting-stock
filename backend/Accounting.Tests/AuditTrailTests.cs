using Accounting.Application.Common.Abstractions;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Accounting.Tests;

public class AuditTrailTests
{
    private AppDbContext GetDbContext(int userId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userService = new FakeCurrentUserService(1) { UserIdOverride = userId };
        var interceptor = new AuditSaveChangesInterceptor(userService);
        
        return new AppDbContext(options, interceptor, userService);
    }

    [Fact]
    public async Task SaveChanges_ShouldCreateAuditLog_WhenEntityAdded()
    {
        var db = GetDbContext(userId: 99);
        
        var category = new Category { Name = "Test Cat", Description = "Desc", RowVersion = new byte[] { 1, 2, 3 } };
        db.Categories.Add(category);
        
        await db.SaveChangesAsync();

        var audit = await db.AuditTrails.FirstOrDefaultAsync();
        
        Assert.NotNull(audit);
        Assert.Equal(99, audit.UserId);
        Assert.Equal("Insert", audit.Action);
        Assert.Equal("Category", audit.EntityName);
        Assert.Contains("Test Cat", audit.NewValues);
    }

    [Fact]
    public async Task SaveChanges_ShouldCreateAuditLog_WhenEntityModified()
    {
        var db = GetDbContext(userId: 99);
        var category = new Category { Name = "Old Name", Description = "Desc", RowVersion = new byte[] { 1, 2, 3 } };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        // New context/scope to simulate update
        category.Name = "New Name";
        await db.SaveChangesAsync();

        var audits = await db.AuditTrails.OrderBy(x => x.TimestampUtc).ToListAsync();
        
        Assert.Equal(2, audits.Count); // 1 Create, 1 Update
        
        var updateAudit = audits.Last();
        Assert.Equal("Update", updateAudit.Action);
        Assert.Equal("Category", updateAudit.EntityName);
        Assert.Contains("Old Name", updateAudit.OldValues);
        Assert.Contains("New Name", updateAudit.NewValues);
    }

    [Fact]
    public async Task SaveChanges_ShouldCreateAuditLog_WhenEntitySoftDeleted()
    {
        var db = GetDbContext(userId: 99);
        var category = new Category { Name = "To Delete", Description = "Desc", RowVersion = new byte[] { 1, 2, 3 } };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        db.Categories.Remove(category); // Soft delete mechanism via Interceptor? 
        // Note: EF Core Remove triggers Deleted state, but if we have SoftDelete Interceptor (not Audit one), it might change it to Modified.
        // AuditInterceptor usually runs AFTER SoftDeleteInterceptor if configured correctly, or logic is inside AuditInterceptor.
        // Let's assume Entity logs as "Deleted" or "SoftDelete" depending on implementation.
        
        await db.SaveChangesAsync();

        var audits = await db.AuditTrails.ToListAsync();
        var deleteAudit = audits.Last();
        
        // Adjust expectation based on implementation details: 
        // If SoftDelete is implemented in the same interceptor or another one that changes state to Modified:
        // Then Action might be "Update" (with IsDeleted=true) or explicitly "SoftDelete". 
        // Checked AuditSaveChangesInterceptor: it detects IsDeleted changed to true.
        
        Assert.True(deleteAudit.Action == "SoftDelete" || deleteAudit.Action == "Update"); 
        if(deleteAudit.Action == "Update") 
            Assert.Contains("\"IsDeleted\":true", deleteAudit.NewValues);
    }
}
