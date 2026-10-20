namespace Accounting.Application.Authentication.Common;

public record AuthenticationResult(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    string AccessToken,
    string RefreshToken // Frontend will ignore this if in Cookie, but for API response logic we might need to handle it.
                        // Actually, per plan, RefreshToken goes to Cookie. So here we might NOT return it in body if we want strict security,
                        // OR we return it here and Controller sets it to Cookie and removes from Body.
                        // Better: Return it in Result, Controller handles the Cookie setting.
);
