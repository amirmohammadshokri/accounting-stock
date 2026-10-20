using Accounting.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Middleware;

public sealed class LicenseMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, LicenseService license)
    {
        var path = context.Request.Path;
        if (!path.StartsWithSegments("/api") ||
            (HttpMethods.IsGet(context.Request.Method) && path.Equals(new PathString("/api/license"))))
        {
            await next(context);
            return;
        }
        var status = await license.GetStatusAsync(context.RequestAborted);
        if (!status.IsExpired)
        {
            await next(context);
            return;
        }
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.Headers.CacheControl = "no-store";
        var problem = new ProblemDetails
        {
            Status = 403, Type = "about:blank", Title = "پایان اعتبار نرم‌افزار",
            Detail = "اعتبار نرم‌افزار پایان یافته است. برای تمدید با پشتیبانی تماس بگیرید؛ اطلاعات شما محفوظ است."
        };
        problem.Extensions["code"] = "license_expired";
        problem.Extensions["expiresAtUtc"] = status.ExpiresAtUtc;
        problem.Extensions["traceId"] = context.TraceIdentifier;
        await context.Response.WriteAsJsonAsync(problem, options: null,
            contentType: "application/problem+json", cancellationToken: context.RequestAborted);
    }
}
