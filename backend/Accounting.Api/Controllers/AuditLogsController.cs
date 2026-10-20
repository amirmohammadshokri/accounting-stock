using Accounting.Application.AuditTrails.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Controllers;

[Route("api/audit-logs")]
[ApiController]
public class AuditLogsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AuditTrailListDto>> GetAuditTrails([FromQuery] GetAuditTrailsQuery query)
    {
        return await mediator.Send(query);
    }
}
