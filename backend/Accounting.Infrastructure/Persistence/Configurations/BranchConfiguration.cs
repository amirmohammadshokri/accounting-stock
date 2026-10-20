using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Infrastructure.Persistence.Configurations;

public sealed class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> b)
    {
        b.ToTable("Branches");

        b.HasKey(x => x.Id);

        b.Property(x => x.Code)
            .IsRequired()
            .HasMaxLength(32);

        b.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(128);

        b.Property(x => x.LogoDataUrl).HasMaxLength(410000);
        b.Property(x => x.Address).HasMaxLength(500);
        b.Property(x => x.Phone).HasMaxLength(50);

        // Code unique olsun
        b.HasIndex(x => x.Code).IsUnique();

        // audit
        b.Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()")
            .ValueGeneratedOnAdd()
            .IsRequired();

        // Ortak helper’lar
        b.ApplyRowVersion();
        b.ApplySoftDelete();
    }
}