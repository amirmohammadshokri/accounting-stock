using Accounting.Application.Units.Queries;
using Accounting.Application.Common.Abstractions;
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Units.Commands.Create;

public class CreateUnitHandler(IAppDbContext db) : IRequestHandler<CreateUnitCommand, UnitDetailDto>
{
    public async Task<UnitDetailDto> Handle(CreateUnitCommand r, CancellationToken ct)
    {
        if (await db.Units.AnyAsync(x => x.Name == r.Name.Trim() && x.Id != 0, ct))
            throw new Accounting.Application.Common.Exceptions.BusinessRuleException("واحد اندازه‌گیری با این نام قبلاً ثبت شده است.");

        var unit = new Accounting.Domain.Entities.Unit
        {
            Name = r.Name.Trim(),
            Description = r.Description?.Trim(),
            RowVersion = []
        };

        db.Units.Add(unit);
        await db.SaveChangesAsync(ct);

        return new UnitDetailDto(
            unit.Id,
            unit.Name,
            unit.Description,
            Convert.ToBase64String(unit.RowVersion),
            unit.CreatedAtUtc,
            unit.UpdatedAtUtc
        );
    }
}
