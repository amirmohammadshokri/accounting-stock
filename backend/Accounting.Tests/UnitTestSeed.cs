using Accounting.Infrastructure.Persistence;

namespace Accounting.Tests;

internal static class UnitTestSeed
{
    public static void Ensure(AppDbContext db)
    {
        if (db.Units.Any()) return;
        db.Units.AddRange(
            new Accounting.Domain.Entities.Unit { Id = 1, Name = "adet" },
            new Accounting.Domain.Entities.Unit { Id = 2, Name = "kutu" });
        db.SaveChanges();
    }
}
