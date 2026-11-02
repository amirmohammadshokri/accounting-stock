using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Roles.Commands.Delete;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Accounting.Tests;

public class ActiveBranchWorkspaceTests
{
    private sealed class WorkspaceUser : ICurrentUserService
    {
        public int? UserId => 1;
        public int? BranchId { get; set; } = 1;
        public bool IsHeadquarters => true;
        public bool IsAdmin => true;
        public bool EnforceBranchScope { get; set; }
        public bool AllBranches { get; set; }
    }

    [Fact]
    public async Task ContextFilters_TrackActiveBranch_AndContactsRemainShared()
    {
        var user = new WorkspaceUser();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new AppDbContext(options, new AuditSaveChangesInterceptor(user), user);
        db.Warehouses.AddRange(new Warehouse { Id=1, BranchId=1, Name="One", Code="W1" },
            new Warehouse { Id=2, BranchId=2, Name="Two", Code="W2" });
        db.Contacts.AddRange(new Contact { BranchId=1, Name="First", Code="C1" }, new Contact { BranchId=2, Name="Second", Code="C2" });
        await db.SaveChangesAsync();
        user.EnforceBranchScope = true;
        Assert.Equal(1, (await db.Warehouses.AsNoTracking().SingleAsync()).Id);
        Assert.Equal(2, await db.Contacts.CountAsync());
        user.BranchId = 2;
        Assert.Equal(2, (await db.Warehouses.AsNoTracking().SingleAsync()).Id);
        user.AllBranches = true;
        Assert.Equal(2, await db.Warehouses.CountAsync());
        // A second DbContext shares EF's cached model but must use its own branch value.
        var other = new WorkspaceUser { BranchId=1, EnforceBranchScope=true };
        await using var second = new AppDbContext(options, new AuditSaveChangesInterceptor(other), other);
        Assert.Equal(1, (await second.Warehouses.AsNoTracking().SingleAsync()).Id);
    }

    [Fact]
    public async Task Writes_CannotTargetAnotherBranch_EvenForAdministrator()
    {
        var user = new WorkspaceUser { EnforceBranchScope=true };
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options, new AuditSaveChangesInterceptor(user), user);
        db.Warehouses.Add(new Warehouse { BranchId=2, Name="Other", Code="W2" });
        await Assert.ThrowsAsync<ForbiddenAccessException>(()=>db.SaveChangesAsync());
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RoleDeletion_OnlyDeletedUsersReleaseTheirAssignment(bool deletedUser)
    {
        var user = new WorkspaceUser();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options, new AuditSaveChangesInterceptor(user), user);
        var role = new Role { Name="Custom role" };
        var assigned = new User { FirstName="Test", LastName="User", Email="test@local", PasswordHash="hash",
            IsActive=false };
        assigned.UserRoles.Add(new UserRole { Role=role });
        db.Users.Add(assigned);
        await db.SaveChangesAsync();
        if (deletedUser)
            await new Accounting.Application.Users.Commands.Delete.SoftDeleteUserHandler(db)
                .Handle(new Accounting.Application.Users.Commands.Delete.SoftDeleteUserCommand(assigned.Id), default);
        var handler = new DeleteRoleHandler(db);
        if (!deletedUser)
            await Assert.ThrowsAsync<FluentValidation.ValidationException>(()=>handler.Handle(new DeleteRoleCommand(role.Id), default));
        else
        {
            await handler.Handle(new DeleteRoleCommand(role.Id), default);
            Assert.Empty(await db.Roles.ToListAsync());
            Assert.Single(await db.Roles.IgnoreQueryFilters().ToListAsync());
        }
    }
}
