using Accounting.Application.Branches.Queries.Dto;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Branches.Commands.Update;

public class UpdateBranchHandler : IRequestHandler<UpdateBranchCommand, BranchDetailDto>
{
    private readonly IAppDbContext _context;

    public UpdateBranchHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BranchDetailDto> Handle(UpdateBranchCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Branches
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            throw new NotFoundException("Branch", request.Id);

        // Concurrency Check
        var rv = Convert.FromBase64String(request.RowVersionBase64);
        if (!rv.SequenceEqual(entity.RowVersion))
        {
            throw new ConcurrencyConflictException("اطلاعات شعبه توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.");
        }

        entity.Code = request.Code.Trim().ToUpperInvariant();
        entity.Name = request.Name.Trim();
        entity.LogoDataUrl = request.LogoDataUrl; entity.Address = request.Address?.Trim(); entity.Phone = request.Phone?.Trim();
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new BranchDetailDto(
            entity.Id, 
            entity.Code, 
            entity.Name, 
            Convert.ToBase64String(entity.RowVersion),
            entity.CreatedAtUtc,
            entity.UpdatedAtUtc
        ) { LogoDataUrl = entity.LogoDataUrl, Address = entity.Address, Phone = entity.Phone };
    }
}
