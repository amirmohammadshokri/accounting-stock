using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.Units.Commands.Update;

public class UpdateUnitValidator : AbstractValidator<UpdateUnitCommand>
{
    public UpdateUnitValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(16);

        RuleFor(x => x.Description)
            .MaximumLength(500);


        RuleFor(x => x.RowVersion).MustBeValidRowVersion();
    }
}
