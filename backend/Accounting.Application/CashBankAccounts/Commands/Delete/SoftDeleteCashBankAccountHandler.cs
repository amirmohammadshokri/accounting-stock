using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions; // ApplyBranchFilter
using Accounting.Application.Common.Interfaces; // ICurrentUserService
using Accounting.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.CashBankAccounts.Commands.Delete;

public class SoftDeleteCashBankAccountHandler : IRequestHandler<SoftDeleteCashBankAccountCommand, bool>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public SoftDeleteCashBankAccountHandler(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(SoftDeleteCashBankAccountCommand r, CancellationToken ct)
    {
        var e = await _db.CashBankAccounts
            .ApplyBranchFilter(_currentUserService)
            .FirstOrDefaultAsync(a => a.Id == r.Id && !a.IsDeleted, ct);
        if (e is null) throw new NotFoundException("CashBankAccount", r.Id);

        _db.Entry(e).Property(nameof(CashBankAccount.RowVersion)).OriginalValue = Convert.FromBase64String(r.RowVersion);

        e.IsDeleted = true;
        e.DeletedAtUtc = DateTime.UtcNow;   // Contacts desenine paralel
        e.UpdatedAtUtc = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("حساب هم‌زمان تغییر کرده است؛ دوباره بارگذاری کنید.");
        }
    }
}
