using Accounting.Infrastructure.Maintenance;
using Microsoft.AspNetCore.Mvc;
namespace Accounting.Api.Middleware;
public sealed class DataMaintenanceMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context,DataMaintenanceGate gate)
    {
        if(gate.IsActive && context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode=503;context.Response.Headers.RetryAfter="5";
            await context.Response.WriteAsJsonAsync(new ProblemDetails{Status=503,Title="پاک‌سازی در حال اجراست",Detail="مدیر در حال پاک‌سازی اطلاعات است؛ چند لحظه بعد دوباره تلاش کنید."},context.RequestAborted);
            return;
        }
        await next(context);
    }
}
