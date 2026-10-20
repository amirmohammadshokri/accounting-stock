using Accounting.Application.Common.Abstractions;
using MediatR;

namespace Accounting.Application.Invoices.Commands.Delete;

public record SoftDeleteInvoiceCommand(
    int Id,
    string RowVersion
    ) : IRequest;
