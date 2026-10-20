using Accounting.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accounting.Infrastructure.Persistence.Configurations;

public static class ConfigurationHelper
{
    public static void ApplySoftDelete<TEntity>(this EntityTypeBuilder<TEntity> b)
        where TEntity : class, ISoftDeletable
    {
        b.HasQueryFilter(e => !e.IsDeleted);
    }

    public static void ApplyRowVersion<TEntity>(this EntityTypeBuilder<TEntity> b)
        where TEntity : class, IHasRowVersion
    {
        b.Property(e => e.RowVersion).IsRowVersion();
    }
}
