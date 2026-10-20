using Accounting.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Accounting.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public int? UserId => GetClaimValue("id"); // or JwtRegisteredClaimNames.Sub

    public int? BranchId => GetClaimValue("branchId");

    public bool IsHeadquarters 
    {
        get 
        {
            var val = httpContextAccessor.HttpContext?.User?.FindFirstValue("isHeadquarters");
            return val != null && bool.TryParse(val, out var res) && res;
        }
    }

    public bool IsAdmin 
    {
        get
        {
            // Check for "Admin" role
            return httpContextAccessor.HttpContext?.User is { } user
                && (user.IsInRole("مدیر سامانه") || user.IsInRole("Admin"));
        }
    }

    private int? GetClaimValue(string claimType)
    {
        var value = httpContextAccessor.HttpContext?.User?.FindFirstValue(claimType);
        return value != null && int.TryParse(value, out var id) ? id : null;
    }
}
