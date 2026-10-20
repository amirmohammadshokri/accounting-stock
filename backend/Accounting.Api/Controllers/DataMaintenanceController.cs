using System.ComponentModel.DataAnnotations;
using Accounting.Infrastructure.Maintenance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Accounting.Api.Controllers;

[ApiController]
[Route("api/data-maintenance")]
[Authorize(Roles="مدیر سامانه,Admin")]
public sealed class DataMaintenanceController(DataMaintenanceService maintenance) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore=true,Location=ResponseCacheLocation.None)]
    public Task<IReadOnlyList<DataCount>> Preview(CancellationToken ct)=>maintenance.PreviewAsync(ct);

    [HttpPost("reset")]
    [EnableRateLimiting("data-reset")]
    public Task<DataResetResult> Reset(ResetOperationalDataRequest request,CancellationToken ct)=>
        maintenance.ResetAsync(request.Password,request.Confirmation,request.Acknowledge,ct);
}
public sealed record ResetOperationalDataRequest(
    [Required,MaxLength(256)]string Password,
    [Required,MaxLength(64)]string Confirmation,bool Acknowledge);
