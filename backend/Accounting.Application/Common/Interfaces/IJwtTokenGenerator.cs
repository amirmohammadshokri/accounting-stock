using Accounting.Domain.Entities;

namespace Accounting.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user, List<string> permissions);
    (string Token, DateTime ExpiryUtc) GenerateRefreshToken();
}
