using Accounting.Api.Controllers;
using Accounting.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace Accounting.Tests;

public class AuditAuthorizationTests
{
    [Fact]
    public void AuditLogs_RequiresAnExplicitPermission()
    {
        var action = typeof(AuditLogsController).GetMethod(nameof(AuditLogsController.GetAuditTrails))!;
        var policies = action.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>();
        Assert.Contains(policies, policy => policy.Policy == Permissions.Audit.Read);
        Assert.Contains(Permissions.Audit.Read, Permissions.GetAll());
    }
}
