using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.Property(rp => rp.Permission)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(rp => new { rp.RoleId, rp.Permission }).IsUnique();
    }
}
