using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class CompanySettingsConfiguration : IEntityTypeConfiguration<CompanySettings>
{
    public void Configure(EntityTypeBuilder<CompanySettings> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.NationalId).HasMaxLength(11);
        builder.Property(x => x.PostalCode).HasMaxLength(10);

        builder.Property(x => x.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.TaxNumber).HasMaxLength(20);
        builder.Property(x => x.TaxOffice).HasMaxLength(100);
        builder.Property(x => x.Phone).HasMaxLength(20);
        builder.Property(x => x.Email).HasMaxLength(100);
        builder.Property(x => x.Website).HasMaxLength(100);
        builder.Property(x => x.TradeRegisterNo).HasMaxLength(50);
        builder.Property(x => x.MersisNo).HasMaxLength(50);
        builder.Property(x => x.LogoUrl).HasMaxLength(410000);

        builder.Property(x => x.RowVersion)
            .IsRowVersion();
    }
}
