using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.Units.Commands.Delete;

public class DeleteUnitValidator : AbstractValidator<DeleteUnitCommand>
{
    public DeleteUnitValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).MustBeValidRowVersion();
    }
}
