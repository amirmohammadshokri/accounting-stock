using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.CashBankAccounts.Commands.Delete;

public class SoftDeleteCashBankAccountValidator : AbstractValidator<SoftDeleteCashBankAccountCommand>
{
    public SoftDeleteCashBankAccountValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).MustBeValidRowVersion();
    }
}
