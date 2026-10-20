using FluentValidation;

namespace Accounting.Application.Items.Queries.GetById;

public class GetItemByIdValidator : AbstractValidator<GetItemByIdQuery>
{
    public GetItemByIdValidator() { RuleFor(x => x.Id).GreaterThan(0); }
}
