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
public class AuthController(ISender mediator) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var command = new LoginCommand(
            request.Email,
            request.Password
        );

        var authResult = await mediator.Send(command);

        SetRefreshTokenCookie(authResult.RefreshToken, authResult.RefreshTokenExpiresAtUtc);

        return Ok(MapToAuthResponse(authResult));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
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
            
            SetRefreshTokenCookie(authResult.RefreshToken, authResult.RefreshTokenExpiresAtUtc);
            
            return Ok(MapToAuthResponse(authResult));
        }
        catch (Accounting.Application.Common.Exceptions.BusinessRuleException ex)
        {
            Response.Cookies.Delete("refreshToken", new CookieOptions { Path = "/", Secure = true, HttpOnly = true, SameSite = SameSiteMode.Strict });
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("session")]
    public async Task<IActionResult> Session(CancellationToken ct)
    {
        if (!TryGetSession(out var id, out var sid)) return Unauthorized();
        Response.Headers.CacheControl = "no-store";
        var session = await mediator.Send(new SessionQuery(id, sid), ct);
        return session is null ? Unauthorized() : Ok(session);
    }

    [HttpPost("activity")]
    public async Task<IActionResult> Activity(CancellationToken ct)
    {
        if (!TryGetSession(out var id, out var sid)) return Unauthorized();
        Response.Headers.CacheControl = "no-store";
        var session = await mediator.Send(new SessionActivityCommand(id, sid), ct);
        return session is null ? Unauthorized() : Ok(session);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken)) await mediator.Send(new LogoutCommand(refreshToken), ct);
        Response.Cookies.Delete("refreshToken", new CookieOptions { Path = "/", Secure = true, HttpOnly = true, SameSite = SameSiteMode.Strict });
        return NoContent();
    }

    private bool TryGetSession(out int id, out string sid)
    {
        sid = User.FindFirst("sid")?.Value ?? "";
        return int.TryParse(User.FindFirst("id")?.Value, out id) && sid.Length > 0;
    }

    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAtUtc)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            Secure = true, // HTTPS required
            Path = "/",
            Expires = new DateTimeOffset(DateTime.SpecifyKind(expiresAtUtc, DateTimeKind.Utc))
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
            authResult.AccessToken,
            authResult.Session
        );
    }
}

public record LoginRequest(string Email, string Password);
