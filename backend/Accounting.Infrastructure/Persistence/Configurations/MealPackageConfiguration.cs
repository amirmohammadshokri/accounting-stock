using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Accounting.Infrastructure.Persistence.Configurations;

public class MealPackageConfiguration : IEntityTypeConfiguration<MealPackage>
{
    public void Configure(EntityTypeBuilder<MealPackage> b)
    {
        b.ToTable("MealPackages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(128).IsRequired();
        b.ApplyRowVersion(); b.ApplySoftDelete();
        b.HasMany(x => x.Lines).WithOne().HasForeignKey(x => x.MealPackageId).OnDelete(DeleteBehavior.Cascade);
    }
}
public class MealPackageLineConfiguration : IEntityTypeConfiguration<MealPackageLine>
{
    public void Configure(EntityTypeBuilder<MealPackageLine> b)
    {
        b.ToTable("MealPackageLines"); b.HasKey(x => x.Id);
        b.Property(x => x.Quantity).HasPrecision(18, 3);
        b.Property(x => x.UnitPrice).HasPrecision(18, 4);
        b.Property(x => x.DiscountRate).HasPrecision(5, 2);
        b.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
    }
}
