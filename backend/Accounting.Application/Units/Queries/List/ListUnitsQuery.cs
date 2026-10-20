using Accounting.Application.Common.Models;
using MediatR;

namespace Accounting.Application.Units.Queries.List;

public record ListUnitsQuery(
    string? Search = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<PagedResult<UnitListItemDto>>;
