using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Users.Queries.Dto;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Users.Queries.GetById;

public class GetUserByIdHandler : IRequestHandler<GetUserByIdQuery, UserDetailDto>
{
    private readonly IAppDbContext _db;

    public GetUserByIdHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<UserDetailDto> Handle(GetUserByIdQuery request, CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.Branch)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.Id && !u.IsDeleted, ct);

        if (user is null)
            throw new NotFoundException("User", request.Id);

        var roles = user.UserRoles
            .Select(ur => ur.Role.Name)
            .ToList();

        return new UserDetailDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.BranchId,
            user.Branch?.Name,
            user.IsActive,
            roles,
            user.CreatedAtUtc,
            user.UpdatedAtUtc
        );
    }
}
