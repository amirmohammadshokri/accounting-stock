using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Domain.Constants;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Api.Middleware;

public sealed class BranchContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IAppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated != true || !context.Request.Path.StartsWithSegments("/api")
            || context.Request.Path.StartsWithSegments("/api/auth") || context.Request.Path.StartsWithSegments("/api/license"))
        { await next(context); return; }

        if (!int.TryParse(context.User.FindFirst("id")?.Value, out var userId)) throw new ForbiddenAccessException();
        var user = await db.Users.AsNoTracking().Include(u => u.AllowedBranches)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, context.RequestAborted)
            ?? throw new ForbiddenAccessException();
        var allowed = user.AllowedBranches.Select(b => b.BranchId).ToHashSet();
        if (user.BranchId.HasValue) allowed.Add(user.BranchId.Value);
        var crossBranch = context.User.HasClaim("permission", Permissions.Branch.ViewAll);
        var path = context.Request.Path.Value!.ToLowerInvariant();
        var listRead = HttpMethods.IsGet(context.Request.Method)
            && (path.StartsWith("/api/reports/") || !path.Split('/').Any(segment => int.TryParse(segment, out _)));
        var all = listRead && context.Request.Headers["X-Branch-Scope"] == "all";
        if (all && !crossBranch) throw new ForbiddenAccessException();
        var raw = context.Request.Headers["X-Branch-Id"].FirstOrDefault();
        if (listRead && context.Request.Query.TryGetValue("branchId", out var filter) && !string.IsNullOrWhiteSpace(filter))
        { raw = filter; all = false; }
        int? branchId = user.BranchId;
        if (!string.IsNullOrEmpty(raw))
        {
            if (!int.TryParse(raw, out var parsed) || parsed <= 0) throw new ForbiddenAccessException();
            branchId = parsed;
        }
        if (branchId.HasValue && ((!crossBranch && !allowed.Contains(branchId.Value))
            || !await db.Branches.AnyAsync(b => b.Id == branchId.Value, context.RequestAborted)))
            throw new ForbiddenAccessException();

        string[] shared = ["contacts", "items", "units", "categories", "meal-packages", "company-settings", "branches", "users", "roles", "data-maintenance", "invoice-mrt", "invoice-print-layouts"];
        var resource = path.Split('/', StringSplitOptions.RemoveEmptyEntries).ElementAtOrDefault(1) ?? "";
        if (!branchId.HasValue && !all && !shared.Contains(resource))
            throw new FluentValidation.ValidationException("ابتدا شعبه فعال را انتخاب کنید؛ شعبه پیش‌فرض یا مجاز باید در مدیریت کاربر تعیین شود.");
        if (branchId.HasValue) context.Items["ActiveBranchId"] = branchId.Value;
        context.Items["EnforceBranchScope"] = resource != "data-maintenance";
        context.Items["AllBranches"] = all;
        await next(context);
    }
}
