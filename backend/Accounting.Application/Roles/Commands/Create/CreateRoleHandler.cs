using Accounting.Application.Common.Abstractions;
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Roles.Commands.Create;

public class CreateRoleHandler : IRequestHandler<CreateRoleCommand, int>
{
    private readonly IAppDbContext _db;

    public CreateRoleHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<int> Handle(CreateRoleCommand request, CancellationToken ct)
    {
        // Check name uniqueness
        var exists = await _db.Roles
            .AnyAsync(r => r.Name.ToLower() == request.Name.ToLower(), ct);
        
        if (exists)
            throw new FluentValidation.ValidationException("نام نقش قبلاً ثبت شده است.");

        var role = new Role
        {
            Name = request.Name,
            Description = request.Description
        };

        // Add permissions
        foreach (var permission in request.Permissions)
        {
            role.Permissions.Add(new RolePermission
            {
                Permission = permission
            });
        }

        _db.Roles.Add(role);
        await _db.SaveChangesAsync(ct);

        return role.Id;
    }
}
