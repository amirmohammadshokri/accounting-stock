using FluentValidation;

namespace Accounting.Application.Orders.Commands.CreateInvoice;

public class CreateInvoiceFromOrderValidator : AbstractValidator<CreateInvoiceFromOrderCommand>
{
    public CreateInvoiceFromOrderValidator()
    {
        RuleFor(x => x.OrderId).GreaterThan(0);
    }
}
