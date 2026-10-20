using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> b)
    {
        b.ToTable("Units");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(16);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()").IsRequired();
        b.ApplyRowVersion();
        b.ApplySoftDelete();
        b.HasIndex(x => x.Name).IsUnique().HasFilter("[IsDeleted] = 0");
    }
}
