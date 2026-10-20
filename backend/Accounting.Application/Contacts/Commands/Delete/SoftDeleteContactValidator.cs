using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.Contacts.Commands.Delete;

public class SoftDeleteContactValidator : AbstractValidator<SoftDeleteContactCommand>
{
    public SoftDeleteContactValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).MustBeValidRowVersion();
    }
}
