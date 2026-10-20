using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Users.Commands.Delete;

public class SoftDeleteUserHandler : IRequestHandler<SoftDeleteUserCommand>
{
    private readonly IAppDbContext _db;

    public SoftDeleteUserHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task Handle(SoftDeleteUserCommand request, CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id && !u.IsDeleted, ct);

        if (user is null)
            throw new NotFoundException("User", request.Id);

        user.IsDeleted = true;
        user.DeletedAtUtc = DateTime.UtcNow;
        user.IsActive = false; // Deactivate as well

        await _db.SaveChangesAsync(ct);
    }
}
