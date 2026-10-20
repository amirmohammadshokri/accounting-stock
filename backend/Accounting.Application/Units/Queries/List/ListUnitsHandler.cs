using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Constants;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Units.Queries.List;

public class ListUnitsHandler(IAppDbContext db, Accounting.Application.Common.Interfaces.IListFilterContext? listFilters = null) : IRequestHandler<ListUnitsQuery, PagedResult<UnitListItemDto>>
{
    public async Task<PagedResult<UnitListItemDto>> Handle(ListUnitsQuery r, CancellationToken ct)
    {
        var page = PaginationConstants.NormalizePage(r.Page);
        var size = PaginationConstants.NormalizePageSize(r.PageSize);
        var query = db.Units
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            query = query.Where(x => x.Name.Contains(r.Search.Trim()));
        }

        query = query.ApplyListFilters(listFilters?.Json);

        var totalCount = await query.CountAsync(ct);

        var units = await query
            .OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(ct);

        var items = units.Select(c => new UnitListItemDto(
            c.Id,
            c.Name,
            c.Description,
            Convert.ToBase64String(c.RowVersion),
            c.CreatedAtUtc,
            c.UpdatedAtUtc
        )).ToList();

        return new PagedResult<UnitListItemDto>(totalCount, page, size, items);
    }
}
