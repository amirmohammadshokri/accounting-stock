using MediatR;

namespace Accounting.Application.Invoices.Queries.Print;

public record GetInvoicePdfQuery(int Id, string Format = "a4-portrait", InvoicePrintLayout? Draft = null, string? MrtDraft = null) : IRequest<InvoicePdf>;
