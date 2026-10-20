using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> b)
    {
        b.ToTable("OrderLines");

        b.HasKey(x => x.Id);

        b.Property(x => x.Description).HasMaxLength(200).IsRequired();
        b.Property(x => x.Quantity).HasPrecision(18, 3);
        b.Property(x => x.UnitPrice).HasPrecision(20, 4);
        b.Property(x => x.DiscountRate).HasPrecision(5, 2);
        b.Property(x => x.Total).HasPrecision(18, 2);

        // Audit + Soft Delete
        b.Property(x => x.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");
        b.ApplySoftDelete();

        // Relationships
        b.HasOne(x => x.Item)
            .WithMany()
            .HasForeignKey(x => x.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        b.HasIndex(x => x.OrderId).HasDatabaseName("IX_OrderLines_OrderId");
    }
}
