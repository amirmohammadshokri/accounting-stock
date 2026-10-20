using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Users.Commands.Update;

public class UpdateUserHandler : IRequestHandler<UpdateUserCommand>
{
    private readonly IAppDbContext _db;

    public UpdateUserHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateUserCommand request, CancellationToken ct)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == request.Id && !u.IsDeleted, ct);

        if (user is null)
            throw new NotFoundException("User", request.Id);

        // Check email uniqueness (excluding current user)
        var emailExists = await _db.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != request.Id, ct);
        
        if (emailExists)
            throw new FluentValidation.ValidationException("این ایمیل قبلاً ثبت شده است.");

        // Verify branch exists if provided
        if (request.BranchId.HasValue)
        {
            var branchExists = await _db.Branches
                .AnyAsync(b => b.Id == request.BranchId.Value, ct);
            
            if (!branchExists)
                throw new NotFoundException("Branch", request.BranchId.Value);
        }

        // Verify roles exist
        var roles = await _db.Roles
            .Where(r => request.RoleIds.Contains(r.Id))
            .ToListAsync(ct);
        
        if (roles.Count != request.RoleIds.Count)
            throw new FluentValidation.ValidationException("یک یا چند شناسه نقش نامعتبر است.");

        // Update user properties
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Email = request.Email;
        user.BranchId = request.BranchId;
        user.IsActive = request.IsActive;

        // Update roles - remove old and add new
        user.UserRoles.Clear();
        foreach (var roleId in request.RoleIds)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = roleId
            });
        }

        await _db.SaveChangesAsync(ct);
    }
}
