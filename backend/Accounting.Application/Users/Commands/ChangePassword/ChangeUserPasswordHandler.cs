using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Users.Commands.ChangePassword;

public class ChangeUserPasswordHandler : IRequestHandler<ChangeUserPasswordCommand>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public ChangeUserPasswordHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ChangeUserPasswordCommand request, CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, ct);

        if (user is null)
            throw new NotFoundException("User", request.UserId);

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);

        await _db.SaveChangesAsync(ct);
    }
}
