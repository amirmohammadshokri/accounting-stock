using Accounting.Application.Invoices.Queries.Print;
using Accounting.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Accounting.Api.Controllers;

[ApiController, Route("api/invoice-print-layouts")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class InvoicePrintLayoutsController(IInvoicePrintLayoutStore store, IMediator mediator) : ControllerBase {
    [HttpGet("{format}"), Authorize(Policy = Permissions.CompanySettings.Read)]
    public ActionResult<InvoicePrintLayoutVersion> Get(string format) => Ok(store.Get(format));
    [HttpPut("{format}"), Authorize(Policy = Permissions.CompanySettings.Update)]
    public ActionResult<InvoicePrintLayoutVersion> Save(string format, SaveInvoicePrintLayout request) {
        if (format != request.Layout.Format) return BadRequest("اندازه کاغذ با مسیر یکسان نیست.");
        return Ok(store.Save(request.Layout, request.Version));
    }
    [HttpPost("preview/{id:int}"), Authorize(Policy = Permissions.CompanySettings.Update), Authorize(Policy = Permissions.Invoice.Read)]
    [Produces("application/pdf")]
    public async Task<IActionResult> Preview(int id, InvoicePrintLayout layout, CancellationToken ct) {
        var result = await mediator.Send(new GetInvoicePdfQuery(id, layout.Format, layout), ct);
        return File(result.Content, "application/pdf", result.FileName);
    }
}
