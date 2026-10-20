using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Roles.Commands.Update;

public class UpdateRoleHandler : IRequestHandler<UpdateRoleCommand>
{
    private readonly IAppDbContext _db;

    public UpdateRoleHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateRoleCommand request, CancellationToken ct)
    {
        var role = await _db.Roles
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == request.Id, ct);

        if (role is null)
            throw new NotFoundException("Role", request.Id);

        // Check name uniqueness (excluding current)
        var exists = await _db.Roles
            .AnyAsync(r => r.Name.ToLower() == request.Name.ToLower() && r.Id != request.Id, ct);
        
        if (exists)
            throw new FluentValidation.ValidationException("نام نقش قبلاً ثبت شده است.");

        role.Name = request.Name;
        role.Description = request.Description;

        // Update permissions
        role.Permissions.Clear();
        foreach (var permission in request.Permissions)
        {
            role.Permissions.Add(new RolePermission
            {
                RoleId = role.Id,
                Permission = permission
            });
        }

        await _db.SaveChangesAsync(ct);
    }
}
