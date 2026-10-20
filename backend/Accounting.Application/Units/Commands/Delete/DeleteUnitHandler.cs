using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Units.Commands.Delete;

public class DeleteUnitHandler(IAppDbContext db) : IRequestHandler<DeleteUnitCommand, bool>
{
    public async Task<bool> Handle(DeleteUnitCommand r, CancellationToken ct)
    {
        var unit = await db.Units.FirstOrDefaultAsync(x => x.Id == r.Id, ct);
        if (unit is null)
        {
            throw new NotFoundException("Unit", r.Id);
        }

        // Preserve references from active and soft-deleted items.
        var isUsed = await db.Items.IgnoreQueryFilters().AnyAsync(x => x.UnitId == r.Id, ct);
        if (isUsed)
        {
            throw new BusinessRuleException("این واحد اندازه‌گیری در کالاها استفاده شده است و قابل حذف نیست.");
        }

        if (!unit.RowVersion.SequenceEqual(Convert.FromBase64String(r.RowVersion)))
            throw new ConcurrencyConflictException();
        db.Entry(unit).Property(nameof(unit.RowVersion)).OriginalValue = Convert.FromBase64String(r.RowVersion);

        unit.IsDeleted = true;
        unit.DeletedAtUtc = DateTime.UtcNow;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("واحد اندازه‌گیری توسط کاربر دیگری تغییر کرده است.");
        }

        return true;
    }
}
