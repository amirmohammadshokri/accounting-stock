using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Accounting.Infrastructure.Persistence.Configurations;
public class ContactOpeningBalanceConfiguration : IEntityTypeConfiguration<ContactOpeningBalance>
{
    public void Configure(EntityTypeBuilder<ContactOpeningBalance> b)
    {
        b.ToTable("ContactOpeningBalances", t => t.HasCheckConstraint("CK_ContactOpening_Amount", "[Amount] > 0"));
        b.HasKey(x => x.Id); b.Property(x => x.Amount).HasPrecision(18,2);
        b.Property(x => x.Note).HasMaxLength(500); b.ApplyRowVersion(); b.ApplySoftDelete();
        b.HasIndex(x => x.ContactId).IsUnique().HasFilter("[IsDeleted] = 0");
        b.HasOne<Contact>().WithMany().HasForeignKey(x => x.ContactId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class InventoryOpeningBalanceConfiguration : IEntityTypeConfiguration<InventoryOpeningBalance>
{
    public void Configure(EntityTypeBuilder<InventoryOpeningBalance> b)
    {
        b.ToTable("InventoryOpeningBalances", t => { t.HasCheckConstraint("CK_InventoryOpening_Quantity", "[Quantity] > 0"); t.HasCheckConstraint("CK_InventoryOpening_Cost", "[UnitCost] IS NULL OR [UnitCost] >= 0"); });
        b.HasKey(x => x.Id); b.Property(x => x.Quantity).HasPrecision(18,3); b.Property(x => x.UnitCost).HasPrecision(18,4);
        b.Property(x => x.Note).HasMaxLength(500); b.ApplyRowVersion(); b.ApplySoftDelete();
        b.HasIndex(x => new { x.WarehouseId, x.ItemId }).IsUnique().HasFilter("[IsDeleted] = 0");
        b.HasOne<Item>().WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Warehouse>().WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<StockMovement>().WithMany().HasForeignKey(x => x.StockMovementId).OnDelete(DeleteBehavior.Restrict);
    }
}
