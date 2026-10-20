using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Constants;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Models;
using Accounting.Application.Orders.Dto;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Orders.Queries.List;

public class ListOrdersHandler : IRequestHandler<ListOrdersQuery, PagedResult<OrderListItemDto>>
{
    private readonly Accounting.Application.Common.Interfaces.IListFilterContext? _listFilters;
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public ListOrdersHandler(IAppDbContext db, ICurrentUserService currentUserService, Accounting.Application.Common.Interfaces.IListFilterContext? listFilters = null)
    {
        _listFilters=listFilters;
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<OrderListItemDto>> Handle(ListOrdersQuery q, CancellationToken ct)
    {
        var page = PaginationConstants.NormalizePage(q.Page);
        var pageSize = PaginationConstants.NormalizePageSize(q.PageSize);

        var query = _db.Orders
            .AsNoTracking()
            .Include(o => o.Lines)
            .Include(o => o.Contact)
            .ApplyBranchFilter(_currentUserService);

        // Additional filters (after branch security filter)
        if (q.BranchId.HasValue)
            query = query.Where(x => x.BranchId == q.BranchId.Value);

        if (q.ContactId.HasValue)
            query = query.Where(x => x.ContactId == q.ContactId.Value);

        if (q.Status.HasValue)
            query = query.Where(x => x.Status == q.Status.Value);

        query = query.ApplyListFilters(_listFilters?.Json);

        var total = await query.CountAsync(ct);

        var orders = await query
            .OrderByDescending(x => x.DateUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = orders.Select(o => new OrderListItemDto(
            o.Id,
            o.BranchId,
            o.OrderNumber,
            o.ContactId,
            o.Contact.Name,
            o.DateUtc,
            o.Type,
            o.Status,
            o.TotalNet,
            o.TotalVat,
            o.TotalGross,
            o.Currency,
            o.Description,
            o.CreatedAtUtc,
            o.UpdatedAtUtc
        )).ToList();

        return new PagedResult<OrderListItemDto>(total, page, pageSize, items, null);
    }
}
