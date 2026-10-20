namespace Accounting.Application.Authentication.Common;

public record AuthenticationResult(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    string AccessToken,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    SessionStatus Session
);
