using Accounting.Application.Users.Commands.Create;
using Accounting.Application.Users.Commands.Update;
using Accounting.Application.Users.Queries.GetById;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Authentication;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Accounting.Tests;

public class UserBranchAssignmentsTests
{
    [Fact]
    public async Task MultipleBranches_AndSeparateDefault_PersistAcrossCreateAndEdit()
    {
        var current=new FakeCurrentUserService(1);
        await using var db=new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,new AuditSaveChangesInterceptor(current),current);
        db.Branches.AddRange(new Branch {Id=1,Name="One",Code="B1"},new Branch {Id=2,Name="Two",Code="B2"},new Branch {Id=3,Name="Three",Code="B3"});
        var role=new Role {Name="Staff"};db.Roles.Add(role);await db.SaveChangesAsync();
        var id=await new CreateUserHandler(db,new PasswordHasher()).Handle(new CreateUserCommand(
            "Test","User","multiple@test.local","Initial123!",1,true,[role.Id],[2,3]),default);
        var detail=await new GetUserByIdHandler(db).Handle(new GetUserByIdQuery(id),default);
        Assert.Equal(1,detail.BranchId);
        Assert.Equal(new[]{1,2,3},detail.AllowedBranchIds!.OrderBy(b=>b));
        await new UpdateUserHandler(db).Handle(new UpdateUserCommand(id,"Test","User","multiple@test.local",2,true,[role.Id],[2,3]),default);
        db.ChangeTracker.Clear();
        detail=await new GetUserByIdHandler(db).Handle(new GetUserByIdQuery(id),default);
        Assert.Equal(2,detail.BranchId);
        Assert.Equal(new[]{2,3},detail.AllowedBranchIds!.OrderBy(b=>b));
        await new UpdateUserHandler(db).Handle(new UpdateUserCommand(id,"Test","User","multiple@test.local",2,true,[role.Id],[2,3]),default);
        Assert.Equal(2,await db.Set<UserBranch>().CountAsync());
    }
}
