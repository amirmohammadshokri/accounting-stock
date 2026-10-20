using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class StockConfiguration : IEntityTypeConfiguration<Stock>
{
    public void Configure(EntityTypeBuilder<Stock> b)
    {
        b.ToTable("Stocks");
        b.HasKey(x => x.Id);

        b.Property(x => x.Quantity)
            .HasColumnType("decimal(18,3)")
            .IsRequired();

        b.HasOne(x => x.Branch)
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Item)
            .WithMany()
            .HasForeignKey(x => x.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // audit
        b.Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()")
            .ValueGeneratedOnAdd()
            .IsRequired();

        // concurrency + soft delete
        b.ApplyRowVersion();
        b.ApplySoftDelete();

        // snapshot tekil olmalı: branch+warehouse+item
        b.HasIndex(x => new { x.BranchId, x.WarehouseId, x.ItemId })
            .HasDatabaseName("UX_Stocks_Branch_Warehouse_Item")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        b.HasIndex(x => x.WarehouseId).HasDatabaseName("IX_Stocks_WarehouseId");
        b.HasIndex(x => x.ItemId).HasDatabaseName("IX_Stocks_ItemId");

    }
}
