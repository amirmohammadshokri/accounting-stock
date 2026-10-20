using Accounting.Api.Contracts.Authentication;
using Accounting.Application.Authentication.Commands.Login;
using Accounting.Application.Authentication.Commands.RefreshToken;
using Accounting.Application.Authentication.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Controllers;

// Not: public self-registration kasıtlı olarak yok. Bu, tek şirketli bir
// muhasebe/ERP sistemi - hesaplar admin tarafından POST /api/users üzerinden
// (Permissions.User.Create) şube ve rol atanarak oluşturulur.
[Route("api/auth")]
[ApiController]
[AllowAnonymous]
public class AuthController(ISender mediator) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var command = new LoginCommand(
            request.Email,
            request.Password
        );

        var authResult = await mediator.Send(command);

        SetRefreshTokenCookie(authResult.RefreshToken);

        return Ok(MapToAuthResponse(authResult));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "کوکی تمدید نشست موجود نیست؛ دوباره وارد شوید." });
        }

        // Access Token is optional for simple Refresh flow but nice to have.
        // We can extract it from header if needed.
        // var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        var command = new RefreshTokenCommand("", refreshToken); // AccessToken not strictly used in Handler currently

        try
        {
            var authResult = await mediator.Send(command);
            
            SetRefreshTokenCookie(authResult.RefreshToken);
            
            return Ok(MapToAuthResponse(authResult));
        }
        catch (Accounting.Application.Common.Exceptions.BusinessRuleException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            Secure = true, // HTTPS required
            Expires = DateTime.UtcNow.AddDays(7) 
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }

    private static AuthResponse MapToAuthResponse(AuthenticationResult authResult)
    {
        return new AuthResponse(
            authResult.Id,
            authResult.FirstName,
            authResult.LastName,
            authResult.Email,
            authResult.AccessToken
        );
    }
}

public record LoginRequest(string Email, string Password);
