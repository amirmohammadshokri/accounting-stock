using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public class AuditTrailConfiguration : IEntityTypeConfiguration<AuditTrail>
{
    public void Configure(EntityTypeBuilder<AuditTrail> builder)
    {
        builder.ToTable("AuditTrails");

        builder.Property(a => a.Action).HasMaxLength(20);
        builder.Property(a => a.EntityName).HasMaxLength(100);
        builder.Property(a => a.PrimaryKey).HasMaxLength(100);

        // JSON columns usually nvarchar(max), default is fine.
    }
}
