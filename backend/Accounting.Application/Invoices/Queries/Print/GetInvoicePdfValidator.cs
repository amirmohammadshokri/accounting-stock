using FluentValidation;

namespace Accounting.Application.Invoices.Queries.Print;

public class GetInvoicePdfValidator : AbstractValidator<GetInvoicePdfQuery>
{
    public GetInvoicePdfValidator() {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Format).Must(format => InvoicePrintLayout.Formats.Contains(format)).WithMessage("اندازه کاغذ معتبر نیست.");
    }
}
