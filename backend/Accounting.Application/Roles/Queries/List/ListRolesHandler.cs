using Accounting.Application.Common.Abstractions;
using Accounting.Application.Roles.Queries.Dto;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Roles.Queries.List;

public class ListRolesHandler : IRequestHandler<ListRolesQuery, List<RoleListItemDto>>
{
    private readonly IAppDbContext _db;

    public ListRolesHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<RoleListItemDto>> Handle(ListRolesQuery request, CancellationToken ct)
    {
        var roles = await _db.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new RoleListItemDto(
                r.Id,
                r.Name,
                r.Description,
                r.Permissions.Count
            ))
            .ToListAsync(ct);

        return roles;
    }
}
