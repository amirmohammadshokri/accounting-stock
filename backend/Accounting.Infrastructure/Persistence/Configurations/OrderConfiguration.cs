using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("Orders");

        b.HasKey(x => x.Id);

        b.Property(x => x.OrderNumber).HasMaxLength(20).IsRequired();
        
        // OrderNumber unique per Branch + Type (aynı şubede aynı tipte tekrar edemez)
        b.HasIndex(x => new { x.BranchId, x.Type, x.OrderNumber })
            .IsUnique()
            .HasDatabaseName("IX_Orders_BranchId_Type_OrderNumber");

        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.Description).HasMaxLength(200);

        b.Property(x => x.TotalNet).HasPrecision(18, 2);
        b.Property(x => x.TotalVat).HasPrecision(18, 2);
        b.Property(x => x.TotalGross).HasPrecision(18, 2);

        // Audit + Soft Delete + RowVersion
        b.Property(x => x.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");
        b.ApplySoftDelete();
        b.ApplyRowVersion();

        // Relationships
        b.HasOne(x => x.Contact)
            .WithMany()
            .HasForeignKey(x => x.ContactId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Branch)
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // Lines
        b.HasMany(x => x.Lines)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes for common queries
        b.HasIndex(x => x.BranchId).HasDatabaseName("IX_Orders_BranchId");
        b.HasIndex(x => x.ContactId).HasDatabaseName("IX_Orders_ContactId");
        b.HasIndex(x => x.Status).HasDatabaseName("IX_Orders_Status");
        b.HasIndex(x => x.DateUtc).HasDatabaseName("IX_Orders_DateUtc");
    }
}
