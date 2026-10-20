using Accounting.Application.Common.Models;
using Accounting.Application.Common.Constants;
using Accounting.Application.Payments.Queries.Dto;
using Accounting.Domain.Enums;
using MediatR;

namespace Accounting.Application.Payments.Queries.List;

public record ListPaymentsQuery(
    int PageNumber = 1,
    int PageSize = PaginationConstants.DefaultPageSize,
    string? Sort = "dateUtc:desc",  // ör: "dateUtc:asc" | "amount:desc"
    int? AccountId = null,
    int? ContactId = null,
    PaymentDirection? Direction = null,
    string? DateFromUtc = null,
    string? DateToUtc = null,
    string? Currency = null
) : IRequest<PagedResult<PaymentListItemDto>>;

