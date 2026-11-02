using Accounting.Application.Common.Abstractions;
using Accounting.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Api.Controllers;

[ApiController, Route("api/auth/branches"), Authorize]
public class BranchContextController(IAppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirst("id")?.Value, out var id)) return Unauthorized();
        var user = await db.Users.AsNoTracking().Include(u => u.AllowedBranches).FirstOrDefaultAsync(u => u.Id == id && u.IsActive, ct);
        if (user is null) return Unauthorized();
        var ids = user.AllowedBranches.Select(b => b.BranchId).ToList();
        if (user.BranchId.HasValue) ids.Add(user.BranchId.Value);
        var canViewAll = User.HasClaim("permission", Permissions.Branch.ViewAll);
        var branches = await db.Branches.AsNoTracking().Where(b => canViewAll || ids.Contains(b.Id))
            .OrderBy(b => b.Name).Select(b => new { b.Id, b.Code, b.Name, b.IsHeadquarters }).ToListAsync(ct);
        return Ok(new { defaultBranchId = user.BranchId, canViewAll, branches });
    }
}
