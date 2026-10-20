using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Items.Commands.Create;
using Accounting.Application.Items.Commands.Update;
using Accounting.Application.Items.Queries.GetById;
using Accounting.Application.Items.Queries.List;
using Accounting.Application.Units.Commands.Create;
using Accounting.Application.Units.Commands.Update;
using Accounting.Application.Units.Commands.Delete;
using Accounting.Application.Units.Queries.GetById;
using Accounting.Application.Units.Queries.List;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Accounting.Tests;

public class UnitTests
{
    private sealed class TestUser : ICurrentUserService
    {
        public int? UserId => 1;
        public int? BranchId => 1;
        public bool IsAdmin => true;
        public bool IsHeadquarters => true;
    }

    private static AppDbContext Open()
    {
        var user = new TestUser();
        return new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            new AuditSaveChangesInterceptor(user), user);
    }

    [Fact]
    public async Task UnitCrud_SearchAndPagination_KeepDeletedUnitsHidden()
    {
        using var db = Open();
        var created = await new CreateUnitHandler(db).Handle(new(" kg ", " weight "), default);
        Assert.Equal("kg", created.Name);
        Assert.Equal("weight", created.Description);
        var entity = await db.Units.SingleAsync();
        entity.RowVersion = new byte[] { 1 };
        await db.SaveChangesAsync();
        var version = Convert.ToBase64String(entity.RowVersion);
        var updated = await new UpdateUnitHandler(db).Handle(new(created.Id, "gram", null, version), default);
        Assert.Equal("gram", updated.Name);
        Assert.Equal("gram", (await new GetUnitByIdHandler(db).Handle(new(created.Id), default)).Name);
        var list = await new ListUnitsHandler(db).Handle(new("gram", -1, 1000), default);
        Assert.Single(list.Items);
        await new DeleteUnitHandler(db).Handle(new(created.Id, Convert.ToBase64String(entity.RowVersion)), default);
        Assert.Empty(await db.Units.ToListAsync());
        Assert.True((await db.Units.IgnoreQueryFilters().SingleAsync()).IsDeleted);
        await Assert.ThrowsAsync<NotFoundException>(() => new GetUnitByIdHandler(db).Handle(new(created.Id), default));
    }

    [Fact]
    public async Task DuplicateName_AndStaleVersions_AreRejected()
    {
        using var db = Open();
        var created = await new CreateUnitHandler(db).Handle(new("kg", null), default);
        await Assert.ThrowsAsync<BusinessRuleException>(() => new CreateUnitHandler(db).Handle(new(" kg ", null), default));
        var other = await new CreateUnitHandler(db).Handle(new("box", null), default);
        var entity = await db.Units.SingleAsync(x => x.Id == created.Id);
        entity.RowVersion = new byte[] { 1 };
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<ConcurrencyConflictException>(() => new UpdateUnitHandler(db)
            .Handle(new(created.Id, "gram", null, "Ag=="), default));
        await Assert.ThrowsAsync<ConcurrencyConflictException>(() => new DeleteUnitHandler(db)
            .Handle(new(created.Id, "Ag=="), default));
        var otherVersion = Convert.ToBase64String((await db.Units.FindAsync(other.Id))!.RowVersion);
        await Assert.ThrowsAsync<BusinessRuleException>(() => new UpdateUnitHandler(db)
            .Handle(new(other.Id, "kg", null, otherVersion), default));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task UnitUsedByAnyItem_CannotBeDeleted(bool deletedItem)
    {
        using var db = Open();
        var unit = new Accounting.Domain.Entities.Unit { Name = "kg" };
        db.Units.Add(unit);
        await db.SaveChangesAsync();
        var item = new Item { Name = "Rice", Code = "RICE", UnitId = unit.Id };
        db.Items.Add(item);
        await db.SaveChangesAsync();
        if (deletedItem) { item.IsDeleted = true; await db.SaveChangesAsync(); }
        await Assert.ThrowsAsync<BusinessRuleException>(() => new DeleteUnitHandler(db)
            .Handle(new(unit.Id, Convert.ToBase64String(unit.RowVersion)), default));
    }

    [Fact]
    public async Task ItemCreateUpdateReadAndFilter_UseUnitIdsAndNames()
    {
        using var db = Open();
        var kg = await new CreateUnitHandler(db).Handle(new("kg", null), default);
        var box = await new CreateUnitHandler(db).Handle(new("box", null), default);
        var created = await new CreateItemHandler(db).Handle(ItemCommand(kg.Id), default);
        Assert.Equal(kg.Id, created.UnitId);
        Assert.Equal("kg", created.UnitName);
        var updated = await new UpdateItemHandler(db).Handle(new(created.Id, null, "RICE", "Rice",
            ItemType.Inventory, box.Id, 0, null, null, null, null, null, null, created.RowVersion), default);
        Assert.Equal(box.Id, updated.UnitId);
        var read = await new GetItemByIdHandler(db).Handle(new(created.Id), default);
        Assert.Equal("box", read.UnitName);
        var handler = new ListItemsHandler(db, new TestUser());
        Assert.Single((await handler.Handle(new(UnitId: box.Id), default)).Items);
        Assert.Empty((await handler.Handle(new(UnitId: kg.Id), default)).Items);
    }

    private static CreateItemCommand ItemCommand(int unitId) => new(null, "RICE", "Rice",
        ItemType.Inventory, unitId, 0, null, null, null, null, null, null);

    [Fact]
    public async Task MissingOrDeletedUnit_IsRejectedByItemHandlerAndValidator()
    {
        using var db = Open();
        var unit = new Accounting.Domain.Entities.Unit { Name = "kg" };
        db.Units.Add(unit);
        await db.SaveChangesAsync();
        unit.IsDeleted = true;
        await db.SaveChangesAsync();
        var validator = new CreateItemValidator(db);
        foreach (var id in new[] { 0, 999, unit.Id })
        {
            Assert.False((await validator.ValidateAsync(ItemCommand(id))).IsValid);
            await Assert.ThrowsAsync<NotFoundException>(() => new CreateItemHandler(db).Handle(ItemCommand(id), default));
        }
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("name-longer-than-sixteen")]
    public void InvalidUnitNames_AreRejected(string name)
        => Assert.False(new CreateUnitValidator().Validate(new CreateUnitCommand(name, null)).IsValid);

    [Fact]
    public void InvalidConcurrencyTokens_AreRejected()
    {
        Assert.False(new UpdateUnitValidator().Validate(new UpdateUnitCommand(1, "kg", null, "!invalid")).IsValid);
        Assert.False(new DeleteUnitValidator().Validate(new DeleteUnitCommand(1, "")).IsValid);
    }
}
