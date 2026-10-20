using Accounting.Application.Cheques.Queries.Dto;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Constants;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Models;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Cheques.Queries.List;

public class ListChequesHandler : IRequestHandler<ListChequesQuery, PagedResult<ChequeDetailDto>>
{
    private readonly Accounting.Application.Common.Interfaces.IListFilterContext? _listFilters;
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public ListChequesHandler(IAppDbContext db, ICurrentUserService currentUserService, Accounting.Application.Common.Interfaces.IListFilterContext? listFilters = null)
    {
        _listFilters=listFilters;
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<ChequeDetailDto>> Handle(ListChequesQuery request, CancellationToken ct)
    {
        var page = PaginationConstants.NormalizePage(request.Page);
        var pageSize = PaginationConstants.NormalizePageSize(request.PageSize);

        var query = _db.Cheques
            .AsNoTracking()
            .ApplyBranchFilter(_currentUserService);

        // Filters
        // NOT: EF Core enum.ToString() == parametre karşılaştırmasını SQL'e çeviremiyor
        // ("could not be translated" InvalidOperationException) — string'i önce enum'a
        // parse edip enum == enum olarak karşılaştırmak gerekiyor.
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<ChequeStatus>(request.Status, out var statusFilter))
            query = query.Where(c => c.Status == statusFilter);

        if (!string.IsNullOrWhiteSpace(request.Type) && Enum.TryParse<ChequeType>(request.Type, out var typeFilter))
            query = query.Where(c => c.Type == typeFilter);

        if (!string.IsNullOrWhiteSpace(request.Direction) && Enum.TryParse<ChequeDirection>(request.Direction, out var directionFilter))
            query = query.Where(c => c.Direction == directionFilter);

        query = query.ApplyListFilters(_listFilters?.Json);

        var total = await query.CountAsync(ct);

        var cheques = await query
            .OrderByDescending(c => c.DueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ChequeDetailDto(
                c.Id,
                c.BranchId,
                c.ChequeNumber,
                c.Type.ToString(),
                c.Direction.ToString(),
                c.Amount,
                c.Currency,
                c.IssueDate,
                c.DueDate,
                c.ContactId,
                c.Contact != null ? c.Contact.Name : null,
                c.DrawerName,
                c.BankName,
                c.Description,
                c.Status.ToString(),
                c.CreatedAtUtc,
                c.UpdatedAtUtc,
                Convert.ToBase64String(c.RowVersion)
            ))
            .ToListAsync(ct);

        return new PagedResult<ChequeDetailDto>(total, page, pageSize, cheques, null);
    }
}
