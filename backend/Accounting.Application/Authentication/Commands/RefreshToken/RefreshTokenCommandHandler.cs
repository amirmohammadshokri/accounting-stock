using Accounting.Application.Authentication.Common;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Accounting.Application.Authentication.Commands.RefreshToken;

public class RefreshTokenCommandHandler(
    IAppDbContext context,
    IJwtTokenGenerator jwtTokenGenerator) : IRequestHandler<RefreshTokenCommand, AuthenticationResult>
{
    public async Task<AuthenticationResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // 1. Get Principal from Expired Token (to get UserId)
        // Note: For MVP we can trust the RefreshToken lookup or extract UserId from AccessToken safely.
        // It's safer to find user by RefreshToken explicitly.
        
        var user = await context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, cancellationToken);

        // 2. Validate Refresh Token
        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new BusinessRuleException("توکن تمدید نشست نامعتبر است یا اعتبار آن پایان یافته است.");
        }

        // 3. User Active Check
        if (!user.IsActive)
        {
            throw new BusinessRuleException("حساب کاربری فعال نیست.");
        }

        // 4. Generate New Tokens (Rotation)
        
        // Collect permissions
        var permissions = user.UserRoles
            .Select(ur => ur.Role)
            .Where(r => r != null)
            .SelectMany(r => r!.Permissions)
            .Select(p => p.Permission)
            .Distinct()
            .ToList();

        var newAccessToken = jwtTokenGenerator.GenerateAccessToken(user, permissions);
        var (newRefreshToken, newRefreshTokenExpiry) = jwtTokenGenerator.GenerateRefreshToken();

        // 5. Update User with New Refresh Token (Revoke old one by overwriting)
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = newRefreshTokenExpiry;

        await context.SaveChangesAsync(cancellationToken);

        return new AuthenticationResult(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            newAccessToken,
            newRefreshToken
        );
    }
}
