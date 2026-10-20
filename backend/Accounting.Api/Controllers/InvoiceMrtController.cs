using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Text;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Invoices.Queries.Print;
using Accounting.Domain.Constants;
using Accounting.Infrastructure.Reporting;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Controllers;
[ApiController,Route("api/invoice-mrt")]
[Authorize(Policy=Permissions.CompanySettings.Read)]
[Authorize(Policy=Permissions.CompanySettings.Update)]
[ResponseCache(NoStore=true,Location=ResponseCacheLocation.None)]
public sealed class InvoiceMrtController(InvoiceMrtStore store,IInvoicePrintLayoutStore layouts,IAppDbContext db,
    ICurrentUserService currentUser,IAuthorizationService authorization,IMediator mediator,IConfiguration config,IInvoicePdfService renderer):ControllerBase
{
    [HttpGet("{format}")]
    public async Task<IActionResult> Get(string format,[FromQuery]int? invoiceId,CancellationToken ct)
    {
        InvoicePrintDocument document;
        if(invoiceId.HasValue)
        {
            if(!(await authorization.AuthorizeAsync(User,Permissions.Invoice.Read)).Succeeded)return Forbid();
            document=await new InvoicePrintDocumentLoader(db,currentUser).LoadAsync(invoiceId.Value,ct);
        }
        else document=InvoiceDesignerSample.Create();
        var saved=store.Read(format);
        using var data=InvoiceReportData.ForLayout(document,layouts.Get(format).Layout);
        var rows=data.Tables.Cast<DataTable>().ToDictionary(table=>table.TableName,table=>table.Rows.Cast<DataRow>()
            .Select(row=>table.Columns.Cast<DataColumn>().ToDictionary(column=>column.ColumnName,column=>row[column] is DBNull?null:row[column])).ToArray());
        return Ok(new{template=saved.Template ?? store.CreateDefault(format,document),version=saved.Version,isCustom=saved.Template!=null,data=rows,
            designerLicenseKey=StimulsoftLicenseConfiguration.GetKey(config, forDesigner:true)});
    }
    [HttpPut("{format}"),RequestSizeLimit(3*1024*1024)]
    public IActionResult Save(string format,SaveInvoiceMrt request)=>Ok(store.Save(format,request.Template,request.Version));
    [HttpPost("{format}/validate"),RequestSizeLimit(3*1024*1024)]
    public IActionResult Validate(string format,PreviewInvoiceMrt request)=>Ok(new{template=store.Validate(format,request.Template)});
    [HttpPost("{format}/restore")]
    public IActionResult Restore(string format,RestoreInvoiceMrt request){store.Reset(format,request.Version);return NoContent();}
    [HttpGet("{format}/download")]
    public IActionResult Download(string format)
    {
        var saved=store.Read(format);return File(Encoding.UTF8.GetBytes(saved.Template ?? store.CreateDefault(format,InvoiceDesignerSample.Create())),"application/json",$"Invoice-{format}.mrt");
    }
    [HttpPost("{format}/preview"),RequestSizeLimit(3*1024*1024)]
    public IActionResult PreviewSample(string format,PreviewInvoiceMrt request)
    {
        var validated=store.Validate(format,request.Template);
        var pdf=renderer.Render(InvoiceDesignerSample.Create() with {Layout=new InvoicePrintLayout{Format=format},MrtTemplate=validated,IsLayoutPreview=true});
        return File(pdf.Content,"application/pdf",pdf.FileName);
    }
    [HttpPost("{format}/preview/{id:int}"),Authorize(Policy=Permissions.Invoice.Read),RequestSizeLimit(3*1024*1024)]
    public async Task<IActionResult> Preview(string format,int id,PreviewInvoiceMrt request,CancellationToken ct)
    {
        var validated=store.Validate(format,request.Template);
        var pdf=await mediator.Send(new GetInvoicePdfQuery(id,format,MrtDraft:validated),ct);
        return File(pdf.Content,"application/pdf",pdf.FileName);
    }
}
public sealed record SaveInvoiceMrt([Required,StringLength(InvoiceMrtStore.MaxBytes)]string Template,[Required]string Version);
public sealed record RestoreInvoiceMrt([Required]string Version);
public sealed record PreviewInvoiceMrt([Required,StringLength(InvoiceMrtStore.MaxBytes)]string Template);
