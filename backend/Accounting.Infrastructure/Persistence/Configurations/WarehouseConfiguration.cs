using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> b)
    {
        b.ToTable("Warehouses");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).IsRequired().HasMaxLength(64);
        b.Property(x => x.Name).IsRequired().HasMaxLength(256);
        b.Property(x => x.IsDefault).IsRequired();

        b.HasOne(x => x.Branch)
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // audit
        b.Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()")
            .ValueGeneratedOnAdd()
            .IsRequired();

        // concurrency + soft delete
        b.ApplyRowVersion();
        b.ApplySoftDelete();

        // indexes
        b.HasIndex(x => x.BranchId).HasDatabaseName("IX_Warehouses_BranchId");

        // şube içinde kod unique olsun (soft delete filter ile)
        b.HasIndex(x => new { x.BranchId, x.Code })
            .HasDatabaseName("UX_Warehouses_Branch_Code")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");
    }
}
