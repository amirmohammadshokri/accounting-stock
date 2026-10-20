using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> b)
    {
        b.ToTable("StockMovements");
        b.HasKey(x => x.Id);

        b.Property(x => x.Type).IsRequired();
        b.Property(x => x.Quantity)
            .HasColumnType("decimal(18,3)")
            .IsRequired();

        b.Property(x => x.TransactionDateUtc).IsRequired();

        b.Property(x => x.Note).HasMaxLength(500);

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

        // Invoice ilişkisi (opsiyonel - fatura kaynaklı hareketler için)
        b.HasOne(x => x.Invoice)
            .WithMany()
            .HasForeignKey(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.SetNull); // Fatura silinirse hareket kalır, InvoiceId null olur

        // audit
        b.Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()")
            .ValueGeneratedOnAdd()
            .IsRequired();

        // concurrency + soft delete
        b.ApplyRowVersion();
        b.ApplySoftDelete();

        // list performansı
        b.HasIndex(x => x.BranchId).HasDatabaseName("IX_StockMovements_BranchId");
        b.HasIndex(x => x.WarehouseId).HasDatabaseName("IX_StockMovements_WarehouseId");
        b.HasIndex(x => x.ItemId).HasDatabaseName("IX_StockMovements_ItemId");
        b.HasIndex(x => x.InvoiceId).HasDatabaseName("IX_StockMovements_InvoiceId");
        b.HasIndex(x => x.TransactionDateUtc).HasDatabaseName("IX_StockMovements_TransactionDateUtc");
        // Note arama performansı için (filtered index - sadece dolu olanlar)
        b.HasIndex(x => x.Note)
            .HasDatabaseName("IX_StockMovements_Note")
            .HasFilter("[Note] IS NOT NULL");

        b.ToTable(t =>
        {
            t.HasCheckConstraint("CK_StockMovements_Quantity_Positive", "[Quantity] > 0");
        });
    }
}
