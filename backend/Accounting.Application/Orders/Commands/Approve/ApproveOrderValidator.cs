using FluentValidation;

namespace Accounting.Application.Orders.Commands.Approve;

public class ApproveOrderValidator : AbstractValidator<ApproveOrderCommand>
{
    public ApproveOrderValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).NotEmpty();
    }
}
