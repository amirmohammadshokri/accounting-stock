using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Roles.Queries.Dto;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Roles.Queries.GetById;

public class GetRoleByIdHandler : IRequestHandler<GetRoleByIdQuery, RoleDetailDto>
{
    private readonly IAppDbContext _db;

    public GetRoleByIdHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<RoleDetailDto> Handle(GetRoleByIdQuery request, CancellationToken ct)
    {
        var role = await _db.Roles
            .AsNoTracking()
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == request.Id, ct);

        if (role is null)
            throw new NotFoundException("Role", request.Id);

        var permissions = role.Permissions
            .Select(rp => rp.Permission)
            .ToList();

        return new RoleDetailDto(
            role.Id,
            role.Name,
            role.Description,
            permissions
        );
    }
}
