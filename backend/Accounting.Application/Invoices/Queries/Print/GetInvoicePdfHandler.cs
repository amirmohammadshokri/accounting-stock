using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Invoices.Queries.Print;

public class GetInvoicePdfHandler(IAppDbContext db,ICurrentUserService user,IInvoicePdfService pdf):IRequestHandler<GetInvoicePdfQuery,InvoicePdf>
{
    public async Task<InvoicePdf> Handle(GetInvoicePdfQuery request,CancellationToken ct)
    {
        var document=await new InvoicePrintDocumentLoader(db,user).LoadAsync(request.Id,ct);
        ct.ThrowIfCancellationRequested();
        return pdf.Render(document with {IsLayoutPreview=request.Draft!=null || request.MrtDraft!=null,
            MrtTemplate=request.MrtDraft,Layout=request.Draft ?? new InvoicePrintLayout{Format=request.Format}});
    }
}
