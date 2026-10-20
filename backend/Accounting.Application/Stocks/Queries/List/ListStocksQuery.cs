using Accounting.Application.Common.Models;
using Accounting.Application.Common.Constants;
using Accounting.Application.Stocks.Queries.Dto;
using MediatR;

namespace Accounting.Application.Stocks.Queries.List;

public record ListStocksQuery(
    int BranchId,
    int? WarehouseId = null,
    string? Search = null,          // ItemCode/ItemName içinde arar
    int PageNumber = 1,
    int PageSize = PaginationConstants.DefaultPageSize,
    string? Sort = "itemName:asc"   // itemCode/itemName/qty
) : IRequest<PagedResult<StockListItemDto>>;
