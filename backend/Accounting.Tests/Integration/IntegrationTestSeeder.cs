using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;

namespace Accounting.Tests.Integration;

/// <summary>Shared seeding helpers for HTTP-level integration tests.</summary>
internal static class IntegrationTestSeeder
{
    public const string DefaultPassword = "Test123!";

    /// <summary>Creates a branch, a role granting exactly the given permissions, and a
    /// user in that branch/role. Returns the login credentials so the test can go through
    /// the real POST /api/auth/login flow instead of minting a token itself.</summary>
    public static async Task<(int branchId, string email, string password)> SeedBranchUserAsync(
        AppDbContext db,
        IPasswordHasher hasher,
        bool isHeadquarters,
        params string[] permissions)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];

        var branch = new Branch { Name = $"Branch-{suffix}", Code = $"BR-{suffix}", IsHeadquarters = isHeadquarters };
        db.Branches.Add(branch);

        var role = new Role { Name = $"Role-{suffix}", IsStatic = false };
        foreach (var permission in permissions)
        {
            role.Permissions.Add(new RolePermission { Permission = permission });
        }
        db.Roles.Add(role);

        var email = $"user-{suffix}@test.local";
        var user = new User
        {
            FirstName = "Test",
            LastName = "User",
            Email = email,
            PasswordHash = hasher.HashPassword(DefaultPassword),
            IsActive = true,
            Branch = branch,
        };
        user.UserRoles.Add(new UserRole { Role = role });
        db.Users.Add(user);

        await db.SaveChangesAsync();

        return (branch.Id, email, DefaultPassword);
    }
}
