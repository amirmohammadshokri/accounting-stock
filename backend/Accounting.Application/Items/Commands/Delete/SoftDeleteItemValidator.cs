using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.Items.Commands.Delete;

public class SoftDeleteItemValidator : AbstractValidator<SoftDeleteItemCommand>
{
    public SoftDeleteItemValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).MustBeValidRowVersion();
    }
}
