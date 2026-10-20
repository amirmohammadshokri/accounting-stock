using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Users.Commands.Create;

public class CreateUserHandler : IRequestHandler<CreateUserCommand, int>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<int> Handle(CreateUserCommand request, CancellationToken ct)
    {
        // Check email uniqueness
        var emailExists = await _db.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), ct);
        
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

        // Create user
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            BranchId = request.BranchId,
            IsActive = request.IsActive
        };

        // Assign roles
        foreach (var roleId in request.RoleIds)
        {
            user.UserRoles.Add(new UserRole
            {
                RoleId = roleId
            });
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return user.Id;
    }
}
