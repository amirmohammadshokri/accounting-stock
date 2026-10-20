using FluentValidation;

namespace Accounting.Application.Units.Commands.Create;

public class CreateUnitValidator : AbstractValidator<CreateUnitCommand>
{
    public CreateUnitValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(16);

        RuleFor(x => x.Description)
            .MaximumLength(500);

    }
}
