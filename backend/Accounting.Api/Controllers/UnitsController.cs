using Accounting.Application.Common.Models;
using Accounting.Application.Units.Commands.Create;
using Accounting.Application.Units.Commands.Update;
using Accounting.Application.Units.Commands.Delete;
using Accounting.Application.Units.Queries;
using Accounting.Application.Units.Queries.GetById;
using Accounting.Application.Units.Queries.List;
using Accounting.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Controllers;

[ApiController]
[Route("api/units")]
public class UnitsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = Permissions.Unit.Read)]
    public async Task<ActionResult<PagedResult<UnitListItemDto>>> List(
        [FromQuery] ListUnitsQuery query, CancellationToken ct)
        => Ok(await mediator.Send(query, ct));

    [HttpGet("{id:int}")]
    [Authorize(Policy = Permissions.Unit.Read)]
    public async Task<ActionResult<UnitDetailDto>> GetById(int id, CancellationToken ct)
        => Ok(await mediator.Send(new GetUnitByIdQuery(id), ct));

    [HttpPost]
    [Authorize(Policy = Permissions.Unit.Create)]
    public async Task<ActionResult<UnitDetailDto>> Create(CreateUnitCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.Unit.Update)]
    public async Task<ActionResult<UnitDetailDto>> Update(int id, UpdateUnitCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest("شناسه مسیر با شناسه درخواست یکسان نیست.");
        return Ok(await mediator.Send(command, ct));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.Unit.Delete)]
    public async Task<IActionResult> Delete(int id, [FromQuery] string rowVersion, CancellationToken ct)
    {
        await mediator.Send(new DeleteUnitCommand(id, rowVersion), ct);
        return NoContent();
    }
}
