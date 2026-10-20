using FluentValidation;

namespace Accounting.Application.CashBankAccounts.Commands.Create;

public class CreateCashBankAccountValidator : AbstractValidator<CreateCashBankAccountCommand>
{
    public CreateCashBankAccountValidator()
    {
        RuleFor(x => x.BranchId).GreaterThan(0);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Iban).MaximumLength(34);
    }
}
