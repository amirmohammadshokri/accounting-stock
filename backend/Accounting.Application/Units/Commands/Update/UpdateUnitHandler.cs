using Accounting.Application.Units.Queries;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Units.Commands.Update;

public class UpdateUnitHandler(IAppDbContext db) : IRequestHandler<UpdateUnitCommand, UnitDetailDto>
{
    public async Task<UnitDetailDto> Handle(UpdateUnitCommand r, CancellationToken ct)
    {
        var unit = await db.Units.FirstOrDefaultAsync(x => x.Id == r.Id, ct);
        if (unit is null)
        {
            throw new NotFoundException("Unit", r.Id);
        }

        if (!unit.RowVersion.SequenceEqual(Convert.FromBase64String(r.RowVersion)))
            throw new ConcurrencyConflictException();
        db.Entry(unit).Property(nameof(unit.RowVersion)).OriginalValue = Convert.FromBase64String(r.RowVersion);

        if (await db.Units.AnyAsync(x => x.Name == r.Name.Trim() && x.Id != r.Id, ct))
            throw new Accounting.Application.Common.Exceptions.BusinessRuleException("واحد اندازه‌گیری با این نام قبلاً ثبت شده است.");

        unit.Name = r.Name.Trim();
        unit.Description = r.Description?.Trim();
        unit.UpdatedAtUtc = DateTime.UtcNow;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("واحد اندازه‌گیری توسط کاربر دیگری تغییر کرده است.");
        }

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
