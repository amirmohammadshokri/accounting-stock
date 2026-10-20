using Accounting.Application.Services;
using Accounting.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Accounting.Api.Controllers;

[ApiController, Route("api/meal-packages")]
public class MealPackagesController(MealPackageService service) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Item.Read)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await service.List(ct));
    [HttpPost, Authorize(Policy = Permissions.Item.Create)]
    public async Task<IActionResult> Create(SaveMealPackage request, CancellationToken ct) => Ok(await service.Save(null, request, ct));
    [HttpPut("{id:int}"), Authorize(Policy = Permissions.Item.Update)]
    public async Task<IActionResult> Update(int id, SaveMealPackage request, CancellationToken ct) => Ok(await service.Save(id, request, ct));
    [HttpDelete("{id:int}"), Authorize(Policy = Permissions.Item.Delete)]
    public async Task<IActionResult> Delete(int id, [FromQuery] string rowVersion, CancellationToken ct)
    { await service.Delete(id, rowVersion, ct); return NoContent(); }
}
