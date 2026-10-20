using FluentValidation;

namespace Accounting.Application.Units.Queries.GetById;

public class GetUnitByIdValidator : AbstractValidator<GetUnitByIdQuery>
{
    public GetUnitByIdValidator() => RuleFor(x => x.Id).GreaterThan(0);
}
