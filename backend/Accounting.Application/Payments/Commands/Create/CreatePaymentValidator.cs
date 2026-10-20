using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Validation;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Payments.Commands.Create;

public class CreatePaymentValidator : AbstractValidator<CreatePaymentCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreatePaymentValidator(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;

        RuleFor(x => x.AccountId)
            .GreaterThan(0)
            .MustAsync(AccountBelongsToBranchAsync).WithMessage("حساب صندوق یا بانک یافت نشد یا متعلق به این شعبه نیست.");

        RuleFor(x => x.Direction).IsInEnum();

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("مبلغ باید بیشتر از صفر باشد.");

        // CommonValidationRules
        RuleFor(x => x.Currency).MustBeValidCurrency();
        RuleFor(x => x.DateUtc).NotEmpty().WithMessage("تاریخ الزامی است.");

        // LinkedInvoiceId validation
        When(x => x.LinkedInvoiceId.HasValue, () =>
        {
            // 1. Invoice exist check & Branch Check
            RuleFor(x => x.LinkedInvoiceId!.Value)
                .MustAsync(InvoiceBelongsToBranchAsync)
                .WithMessage("فاکتور مرتبط یافت نشد، حذف شده است یا متعلق به شعبه دیگری است.");

            // 2. Currency match
            RuleFor(x => x)
                .MustAsync(async (cmd, ct) =>
                {
                    if (!cmd.LinkedInvoiceId.HasValue) return true;

                    var invoice = await _db.Invoices
                        .AsNoTracking()
                        .Where(i => i.Id == cmd.LinkedInvoiceId.Value)
                        .Select(i => new { i.Currency })
                        .FirstOrDefaultAsync(ct);

                    if (invoice == null) return true;

                    var paymentCurrency = (cmd.Currency ?? "IRR").Trim().ToUpperInvariant();
                    return invoice.Currency.ToUpperInvariant() == paymentCurrency;
                })
                .WithMessage("واحد پول پرداخت باید با واحد پول فاکتور یکسان باشد.");

            // 3. Amount <= Balance
            RuleFor(x => x)
                .MustAsync(async (cmd, ct) =>
                {
                    if (!cmd.LinkedInvoiceId.HasValue) return true;

                    var invoice = await _db.Invoices
                        .AsNoTracking()
                        .Where(i => i.Id == cmd.LinkedInvoiceId.Value)
                        .Select(i => new { i.Balance })
                        .FirstOrDefaultAsync(ct);

                    if (invoice == null) return true;

                    return cmd.Amount <= invoice.Balance;
                })
                .WithMessage("مبلغ پرداخت از مانده فاکتور بیشتر است.");
        });
    }

    private async Task<bool> AccountBelongsToBranchAsync(int accountId, CancellationToken ct)
    {
        var account = await _db.CashBankAccounts
            .AsNoTracking()
            .Where(a => a.Id == accountId && !a.IsDeleted)
            .Select(a => new { a.BranchId })
            .FirstOrDefaultAsync(ct);

        if (account == null) return false;

        // Admin/HQ bypass — same rule ApplyBranchFilter applies everywhere else.
        if (_currentUserService.IsAdmin || _currentUserService.IsHeadquarters) return true;

        if (!_currentUserService.BranchId.HasValue) return false;
        return account.BranchId == _currentUserService.BranchId.Value;
    }

    private async Task<bool> InvoiceBelongsToBranchAsync(int invoiceId, CancellationToken ct)
    {
        var invoice = await _db.Invoices
            .AsNoTracking()
            .Where(i => i.Id == invoiceId && !i.IsDeleted)
            .Select(i => new { i.BranchId })
            .FirstOrDefaultAsync(ct);

        if (invoice == null) return false;

        // Admin/HQ bypass — same rule ApplyBranchFilter applies everywhere else.
        if (_currentUserService.IsAdmin || _currentUserService.IsHeadquarters) return true;

        if (!_currentUserService.BranchId.HasValue) return false;
        return invoice.BranchId == _currentUserService.BranchId.Value;
    }
}
