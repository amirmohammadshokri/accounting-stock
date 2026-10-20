using Accounting.Application.Services;
using Accounting.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Accounting.Api.Controllers;
[ApiController, Route("api/opening-balances")]
public class OpeningBalancesController(OpeningBalanceService service) : ControllerBase
{
    [HttpGet("contacts"), Authorize(Policy = Permissions.Contact.Read)]
    public Task<List<OpeningBalanceDto>> Contacts([FromQuery] int? contactId, CancellationToken ct) => service.Contacts(contactId,ct);
    [HttpPost("contacts"), Authorize(Policy = Permissions.CompanySettings.Update), Authorize(Policy = Permissions.Contact.Update)]
    public async Task<ActionResult<OpeningBalanceDto>> CreateContact(ContactOpeningRequest body, CancellationToken ct) => Ok(await service.SaveContact(null,body,ct));
    [HttpPut("contacts/{id:int}"), Authorize(Policy = Permissions.CompanySettings.Update), Authorize(Policy = Permissions.Contact.Update)]
    public async Task<ActionResult<OpeningBalanceDto>> UpdateContact(int id, ContactOpeningRequest body, CancellationToken ct) => Ok(await service.SaveContact(id,body,ct));
    [HttpDelete("contacts/{id:int}"), Authorize(Policy = Permissions.CompanySettings.Update), Authorize(Policy = Permissions.Contact.Update)]
    public async Task<IActionResult> DeleteContact(int id, [FromQuery] string rowVersionBase64, CancellationToken ct) { await service.DeleteContact(id,rowVersionBase64,ct); return NoContent(); }
    [HttpGet("inventory"), Authorize(Policy = Permissions.Stock.Read)]
    public Task<List<OpeningBalanceDto>> Inventory([FromQuery] int? warehouseId, [FromQuery] int? itemId, CancellationToken ct) => service.Inventory(warehouseId,itemId,ct);
    [HttpPost("inventory"), Authorize(Policy = Permissions.CompanySettings.Update), Authorize(Policy = Permissions.StockMovement.Create)]
    public async Task<ActionResult<OpeningBalanceDto>> CreateInventory(InventoryOpeningRequest body, CancellationToken ct) => Ok(await service.SaveInventory(null,body,ct));
    [HttpPut("inventory/{id:int}"), Authorize(Policy = Permissions.CompanySettings.Update), Authorize(Policy = Permissions.StockMovement.Create)]
    public async Task<ActionResult<OpeningBalanceDto>> UpdateInventory(int id, InventoryOpeningRequest body, CancellationToken ct) => Ok(await service.SaveInventory(id,body,ct));
    [HttpDelete("inventory/{id:int}"), Authorize(Policy = Permissions.CompanySettings.Update), Authorize(Policy = Permissions.StockMovement.Create)]
    public async Task<IActionResult> DeleteInventory(int id, [FromQuery] string rowVersionBase64, CancellationToken ct) { await service.DeleteInventory(id,rowVersionBase64,ct); return NoContent(); }
}
