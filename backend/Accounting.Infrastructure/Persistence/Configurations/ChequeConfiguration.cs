using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class ChequeConfiguration : IEntityTypeConfiguration<Cheque>
{
    public void Configure(EntityTypeBuilder<Cheque> builder)
    {
        builder.ToTable("Cheques");
        builder.HasKey(x => x.Id);

        // Properties
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.ChequeNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(3).HasDefaultValue("IRR");
        builder.Property(x => x.BankName).HasMaxLength(100);
        builder.Property(x => x.BankBranch).HasMaxLength(100);
        builder.Property(x => x.AccountNumber).HasMaxLength(50);
        builder.Property(x => x.DrawerName).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(500);

        // Relationships
        builder.HasOne(x => x.Branch)
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Contact)
            .WithMany()
            .HasForeignKey(x => x.ContactId)
            .OnDelete(DeleteBehavior.Restrict);

        // Audit
        builder.Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()")
            .ValueGeneratedOnAdd()
            .IsRequired();

        // Concurrency + Soft Delete
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.ApplySoftDelete();

        // Indexes
        builder.HasIndex(x => x.BranchId).HasDatabaseName("IX_Cheques_BranchId");
        builder.HasIndex(x => x.ContactId).HasDatabaseName("IX_Cheques_ContactId");
        builder.HasIndex(x => x.DueDate).HasDatabaseName("IX_Cheques_DueDate");
        builder.HasIndex(x => x.Status).HasDatabaseName("IX_Cheques_Status");

        // Unique: Branch + ChequeNumber (silinmemiþ kayýtlar için)
        builder.HasIndex(x => new { x.BranchId, x.ChequeNumber })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0")
            .HasDatabaseName("IX_Cheques_BranchId_ChequeNumber_Unique");
    }
}
