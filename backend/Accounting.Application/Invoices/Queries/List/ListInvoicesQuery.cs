using Accounting.Application.Common.Models;
using Accounting.Application.Common.Constants;
using Accounting.Application.Invoices.Queries.Dto;
using MediatR;

namespace Accounting.Application.Invoices.Queries.List;

public enum InvoiceTypeFilter
{
    Any = 0,
    Sales = 1,
    Purchase = 2,
    SalesReturn = 3,
    PurchaseReturn = 4
}

public record ListInvoicesQuery(
    int PageNumber = PaginationConstants.DefaultPage,
    int PageSize = PaginationConstants.DefaultPageSize,
    string? Sort = "dateUtc:desc",
    int? BranchId = null, // (null = tüm şubeler)
    int? ContactId = null,
    InvoiceTypeFilter Type = InvoiceTypeFilter.Any,
    string? DateFromUtc = null, // ISO-8601 UTC
    string? DateToUtc = null // ISO-8601 UTC
) : IRequest<PagedResult<InvoiceListItemDto>>;
