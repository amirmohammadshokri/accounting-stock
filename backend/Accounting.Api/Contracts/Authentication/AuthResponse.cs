namespace Accounting.Api.Contracts.Authentication;

public record AuthResponse(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    string AccessToken,
    Accounting.Application.Authentication.Common.SessionStatus Session
);
