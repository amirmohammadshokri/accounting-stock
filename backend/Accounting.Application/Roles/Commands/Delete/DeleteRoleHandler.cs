using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Roles.Commands.Delete;

public class DeleteRoleHandler : IRequestHandler<DeleteRoleCommand>
{
    private readonly IAppDbContext _db;

    public DeleteRoleHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteRoleCommand request, CancellationToken ct)
    {
        var role = await _db.Roles
            .Include(r => r.UserRoles)
            .FirstOrDefaultAsync(r => r.Id == request.Id, ct);

        if (role is null)
            throw new NotFoundException("Role", request.Id);

        // Prevent deletion if users assigned
        if (await _db.UserRoles.AnyAsync(ur => ur.RoleId == role.Id && _db.Users.Any(u => u.Id == ur.UserId), ct))
            throw new FluentValidation.ValidationException("نقشی که به کاربران اختصاص یافته است قابل حذف نیست.");

        role.IsDeleted = true;
        role.DeletedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
