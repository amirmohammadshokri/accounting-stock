using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.Invoices.Commands.Delete;

public class SoftDeleteInvoiceValidator : AbstractValidator<SoftDeleteInvoiceCommand>
{
    public SoftDeleteInvoiceValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).MustBeValidRowVersion();  // Extension
    }
}
