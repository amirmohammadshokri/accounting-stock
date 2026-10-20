using Accounting.Application.Authentication.Common;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Middleware;

public sealed class SessionValidationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IUserSessionStore sessions)
    {
        var path = context.Request.Path;
        if (context.User.Identity?.IsAuthenticated != true || !path.StartsWithSegments("/api")
            || path.Equals(new PathString("/api/auth/login"))
            || path.Equals(new PathString("/api/auth/refresh"))
            || path.Equals(new PathString("/api/auth/logout")))
        {
            await next(context);
            return;
        }
        var sid = context.User.FindFirst("sid")?.Value;
        if (int.TryParse(context.User.FindFirst("id")?.Value, out var id) && sid is not null
            && await sessions.GetAsync(id, sid, false, context.RequestAborted) is not null)
        {
            await next(context);
            return;
        }
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.Headers.CacheControl = "no-store";
        var problem = new ProblemDetails
        {
            Status = 401, Title = "پایان نشست کاربری",
            Detail = "زمان مجاز نشست یا مهلت بی‌کاری تمام شده است؛ دوباره وارد شوید."
        };
        problem.Extensions["code"] = "session_expired";
        await context.Response.WriteAsJsonAsync(problem, options: null,
            contentType: "application/problem+json", cancellationToken: context.RequestAborted);
    }
}
