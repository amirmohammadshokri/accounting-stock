using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Accounting.Application.Authentication.Common;

namespace Accounting.Infrastructure.Authentication;

public class JwtTokenGenerator(IOptions<JwtSettings> jwtOptions, ISessionPolicy sessionPolicy, TimeProvider clock) : IJwtTokenGenerator
{
    private readonly JwtSettings _jwtSettings = jwtOptions.Value;

public string GenerateAccessToken(User user, List<string> permissions)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.GivenName, user.FirstName),
            new(JwtRegisteredClaimNames.FamilyName, user.LastName),
            new("id", user.Id.ToString()) // Explicit ID claim
        };

        if (!string.IsNullOrWhiteSpace(user.SessionId)) claims.Add(new Claim("sid", user.SessionId));

        // Permissions
        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        // Roles - Add role claims for role-based authorization
        foreach (var userRole in user.UserRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
        }

        // Branch ID
        if (user.BranchId.HasValue)
        {
            claims.Add(new Claim("branchId", user.BranchId.Value.ToString()));
            
            if (user.Branch != null && user.Branch.IsHeadquarters)
            {
                claims.Add(new Claim("isHeadquarters", "true"));
            }
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            IssuedAt = clock.GetUtcNow().UtcDateTime,
            NotBefore = clock.GetUtcNow().UtcDateTime,
            Expires = user.SessionStartedAtUtc.HasValue
                ? new[] { clock.GetUtcNow().UtcDateTime.AddSeconds(_jwtSettings.AccessTokenExpirationSeconds), sessionPolicy.AbsoluteExpiry(user) }.Min()
                : clock.GetUtcNow().UtcDateTime.AddSeconds(_jwtSettings.AccessTokenExpirationSeconds),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public (string Token, DateTime ExpiryUtc) GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        var token = Convert.ToBase64String(randomNumber);
        var expiry = clock.GetUtcNow().UtcDateTime.AddSeconds(_jwtSettings.RefreshTokenExpirationSeconds);
        return (token, expiry);
    }
}
