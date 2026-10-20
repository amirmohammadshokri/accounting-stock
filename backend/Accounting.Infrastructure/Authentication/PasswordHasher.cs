using Accounting.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Accounting.Infrastructure.Authentication;

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        var hasher = new PasswordHasher<object>();
        return hasher.HashPassword(new object(), password);
    }

    public bool VerifyPassword(string passwordHash, string password)
    {
        var hasher = new PasswordHasher<object>();
        var result = hasher.VerifyHashedPassword(new object(), passwordHash, password);
        return result != PasswordVerificationResult.Failed;
    }
}
