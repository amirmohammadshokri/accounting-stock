using Accounting.Application.Authentication.Common;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Authentication.Commands.Login;

public class LoginCommandHandler(
    IAppDbContext context,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator jwtTokenGenerator,
    ISessionPolicy sessionPolicy) : IRequestHandler<LoginCommand, AuthenticationResult>
{
    public async Task<AuthenticationResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // 1. Check User
        var user = await context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.Permissions)
            .Include(u => u.Branch)
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken); // GlobalFilter IsDeleted handles deleted check

        if (user == null)
        {
            // Security: Don't reveal if user exists
            throw new BusinessRuleException("ایمیل یا رمز عبور نادرست است.");
        }

        if (!user.IsActive)
        {
            throw new BusinessRuleException("حساب کاربری فعال نیست.");
        }

        // 2. Verify Password
        if (!passwordHasher.VerifyPassword(user.PasswordHash, request.Password))
        {
             throw new BusinessRuleException("ایمیل یا رمز عبور نادرست است.");
        }

        // 3. Generate Token
        // Collect permissions from all roles
        var permissions = user.UserRoles
            .Select(ur => ur.Role)
            .Where(r => r != null)
            .SelectMany(r => r!.Permissions)
            .Select(p => p.Permission)
            .Distinct()
            .ToList();

        sessionPolicy.Start(user);
        var accessToken = jwtTokenGenerator.GenerateAccessToken(user, permissions);
        var (refreshToken, refreshTokenExpiry) = jwtTokenGenerator.GenerateRefreshToken();
        refreshTokenExpiry = refreshTokenExpiry < sessionPolicy.AbsoluteExpiry(user)
            ? refreshTokenExpiry : sessionPolicy.AbsoluteExpiry(user);

        // 4. Update Refresh Token
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = refreshTokenExpiry;
        
        await context.SaveChangesAsync(cancellationToken);

        return new AuthenticationResult(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            accessToken,
            refreshToken,
            refreshTokenExpiry,
            sessionPolicy.Status(user)
        );
    }
}
