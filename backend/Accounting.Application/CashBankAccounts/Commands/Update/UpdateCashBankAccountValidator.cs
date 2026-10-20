using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.CashBankAccounts.Commands.Update;

public class UpdateCashBankAccountValidator : AbstractValidator<UpdateCashBankAccountCommand>
{
    public UpdateCashBankAccountValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Type).IsInEnum();                // enum doğrulama
        RuleFor(x => x.Name).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Iban).MaximumLength(34);
        RuleFor(x => x.RowVersion).MustBeValidRowVersion();
    }
}
