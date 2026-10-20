using FluentValidation;

namespace Accounting.Application.Categories.Commands.Update;

public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);

        RuleFor(x => x.Color)
            .MaximumLength(20);

        RuleFor(x => x.RowVersion).NotEmpty();
    }
}
