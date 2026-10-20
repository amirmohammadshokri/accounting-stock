using FluentValidation;

namespace Accounting.Application.CashBankAccounts.Queries.GetById;

public class GetCashBankAccountByIdValidator : AbstractValidator<GetCashBankAccountByIdQuery>
{
    public GetCashBankAccountByIdValidator() => RuleFor(x => x.Id).GreaterThan(0);
}
