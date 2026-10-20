using Accounting.Application.Common.Models;
using Accounting.Application.Common.Constants;
using Accounting.Application.Items.Queries.Dto;
using Accounting.Domain.Entities;
using MediatR;

namespace Accounting.Application.Items.Queries.List;

public record ListItemsQuery(
    int PageNumber = 1,
    int PageSize = PaginationConstants.DefaultPageSize,
    string? Search = null,         // Name contains (case-insensitive)
    int? UnitId = null,           // eşleşirse filtre
    int? CategoryId = null,        // filtre
    int? VatRate = null,           // 0..100
    string? Sort = "name:asc"      // "name:asc|desc", "vatRate:asc|desc", "price:asc|desc"
) : IRequest<PagedResult<ItemListItemDto>>;
