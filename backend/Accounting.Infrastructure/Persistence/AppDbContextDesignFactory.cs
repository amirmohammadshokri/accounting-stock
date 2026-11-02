using Accounting.Application.Common.Interfaces;
using Accounting.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Accounting.Infrastructure.Persistence;

// Schema generation never needs the customer's connection or a running API.
public sealed class AppDbContextDesignFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var user = new DesignUser();
        return new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=unused;Database=AccountingSchemaOnly;Trusted_Connection=True;TrustServerCertificate=True")
            .Options, new AuditSaveChangesInterceptor(user), user);
    }

    private sealed class DesignUser : ICurrentUserService
    {
        public int? UserId => null;
        public int? BranchId => null;
        public bool IsHeadquarters => false;
        public bool IsAdmin => false;
    }
}
