using FluentValidation;

namespace Accounting.Application.CashBankAccounts.Queries.List;

public class ListCashBankAccountsValidator : AbstractValidator<ListCashBankAccountsQuery>
{
    public ListCashBankAccountsValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 200);
        RuleFor(x => x.Sort).Must(s =>
            s is null ||
            s.Equals("name:asc", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("name:desc", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("type:asc", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("type:desc", StringComparison.OrdinalIgnoreCase)
        ).WithMessage("روش مرتب‌سازی پشتیبانی نمی‌شود.");
    }
}
