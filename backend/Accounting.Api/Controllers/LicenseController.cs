using Accounting.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Controllers;

[ApiController]
[Route("api/license")]
public sealed class LicenseController(LicenseService license) : ControllerBase
{
    // Read-only, available after expiry as well. There is intentionally no write endpoint.
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public Task<LicenseStatus> Get(CancellationToken cancellationToken) => license.GetStatusAsync(cancellationToken);
}
