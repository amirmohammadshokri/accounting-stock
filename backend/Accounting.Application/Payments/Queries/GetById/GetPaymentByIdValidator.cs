using FluentValidation;

namespace Accounting.Application.Payments.Queries.GetById;

public class GetPaymentByIdValidator : AbstractValidator<GetPaymentByIdQuery>
{
    public GetPaymentByIdValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0);
    }

}
