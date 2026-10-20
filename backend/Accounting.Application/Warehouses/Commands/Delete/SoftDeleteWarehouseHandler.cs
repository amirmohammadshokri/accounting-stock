using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions; // ApplyBranchFilter
using Accounting.Application.Common.Interfaces; // ICurrentUserService
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Warehouses.Commands.Delete;

public class SoftDeleteWarehouseHandler : IRequestHandler<SoftDeleteWarehouseCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public SoftDeleteWarehouseHandler(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task Handle(SoftDeleteWarehouseCommand r, CancellationToken ct)
    {
        var e = await _db.Warehouses
            .ApplyBranchFilter(_currentUserService)
            .FirstOrDefaultAsync(x => x.Id == r.Id, ct);
        if (e is null) throw new NotFoundException("Warehouse", r.Id);

        _db.Entry(e).Property(nameof(Warehouse.RowVersion)).OriginalValue = Convert.FromBase64String(r.RowVersion);

        e.IsDeleted = true;
        e.DeletedAtUtc = DateTime.UtcNow;
        e.UpdatedAtUtc = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("انبار هم‌زمان تغییر کرده است؛ دوباره بارگذاری کنید.");
        }
    }
}
