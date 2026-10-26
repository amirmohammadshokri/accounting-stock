using Accounting.Application.AuditTrails.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Accounting.Domain.Constants;

namespace Accounting.Api.Controllers;

[Route("api/audit-logs")]
[ApiController]
public class AuditLogsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = Permissions.Audit.Read)]
    public async Task<ActionResult<AuditTrailListDto>> GetAuditTrails([FromQuery] GetAuditTrailsQuery query)
    {
        return await mediator.Send(query);
    }
}
