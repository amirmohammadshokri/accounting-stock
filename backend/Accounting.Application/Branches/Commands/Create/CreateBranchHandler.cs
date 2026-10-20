using Accounting.Application.Branches.Queries.Dto;
using Accounting.Application.Common.Abstractions;
using Accounting.Domain.Entities;
using MediatR;

namespace Accounting.Application.Branches.Commands.Create;

public class CreateBranchHandler : IRequestHandler<CreateBranchCommand, BranchDetailDto>
{
    private readonly IAppDbContext _context;

    public CreateBranchHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BranchDetailDto> Handle(CreateBranchCommand request, CancellationToken cancellationToken)
    {
        var entity = new Branch
        {
            Code = request.Code.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            LogoDataUrl = request.LogoDataUrl, Address = request.Address?.Trim(), Phone = request.Phone?.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Branches.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return new BranchDetailDto(
            entity.Id, 
            entity.Code, 
            entity.Name, 
            Convert.ToBase64String(entity.RowVersion ?? Array.Empty<byte>()),
            entity.CreatedAtUtc,
            entity.UpdatedAtUtc
        ) { LogoDataUrl = entity.LogoDataUrl, Address = entity.Address, Phone = entity.Phone };
    }
}
