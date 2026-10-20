using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.AuditTrails.Queries;

public record GetAuditTrailsQuery(
    int Page = 1,
    int PageSize = 20,
    int? UserId = null,
    string? EntityName = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null
) : IRequest<AuditTrailListDto>;

public record AuditTrailListDto(List<AuditTrailDto> Items, int TotalCount);

public record AuditTrailDto(
    int Id,
    int? UserId,
    string? Action,
    string? EntityName,
    string? PrimaryKey,
    string? OldValues,
    string? NewValues,
    DateTime TimestampUtc
);

public class GetAuditTrailsHandler : IRequestHandler<GetAuditTrailsQuery, AuditTrailListDto>
{
    private readonly IAppDbContext _context;

    public GetAuditTrailsHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AuditTrailListDto> Handle(GetAuditTrailsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AuditTrails.AsNoTracking();

        if (request.UserId.HasValue)
        {
            query = query.Where(x => x.UserId == request.UserId);
        }

        if (!string.IsNullOrEmpty(request.EntityName))
        {
            query = query.Where(x => x.EntityName == request.EntityName);
        }

        if (request.StartDate.HasValue)
        {
            query = query.Where(x => x.TimestampUtc >= request.StartDate.Value);
        }

        if (request.EndDate.HasValue)
        {
            query = query.Where(x => x.TimestampUtc <= request.EndDate.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.TimestampUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new AuditTrailDto(
                x.Id,
                x.UserId,
                x.Action,
                x.EntityName,
                x.PrimaryKey,
                x.OldValues,
                x.NewValues,
                x.TimestampUtc
            ))
            .ToListAsync(cancellationToken);

        return new AuditTrailListDto(items, totalCount);
    }
}
