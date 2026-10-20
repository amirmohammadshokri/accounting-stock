using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Units.Queries.GetById;

public class GetUnitByIdHandler(IAppDbContext db) : IRequestHandler<GetUnitByIdQuery, UnitDetailDto>
{
    public async Task<UnitDetailDto> Handle(GetUnitByIdQuery r, CancellationToken ct)
    {
        var unit = await db.Units.AsNoTracking().FirstOrDefaultAsync(x => x.Id == r.Id, ct)
            ?? throw new NotFoundException("Unit", r.Id);
        return new UnitDetailDto(unit.Id, unit.Name, unit.Description,
            Convert.ToBase64String(unit.RowVersion), unit.CreatedAtUtc, unit.UpdatedAtUtc);
    }
}
