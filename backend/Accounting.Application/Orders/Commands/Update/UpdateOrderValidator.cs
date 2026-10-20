using Accounting.Application.Common.Abstractions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Orders.Commands.Update;

public class UpdateOrderValidator : AbstractValidator<UpdateOrderCommand>
{
    private readonly IAppDbContext _db;

    public UpdateOrderValidator(IAppDbContext db)
    {
        _db = db;

        RuleFor(x => x.Id)
            .GreaterThan(0);

        RuleFor(x => x.ContactId)
            .GreaterThan(0)
            .MustAsync(ContactExistsAsync).WithMessage("طرف حساب یافت نشد.");

        RuleFor(x => x.DateUtc)
            .NotEmpty();

        RuleFor(x => x.Description)
            .MaximumLength(200);

        RuleFor(x => x.RowVersion)
            .NotEmpty();

        RuleFor(x => x.Lines)
            .NotEmpty().WithMessage("ثبت حداقل یک ردیف سفارش الزامی است.");

        RuleFor(x => x.Lines).Must(lines => lines == null || lines.Where(l=>l.ItemId.HasValue).Select(l=>l.ItemId).Distinct().Count() == lines.Count(l=>l.ItemId.HasValue))
            .WithMessage("هر کالا فقط یک ردیف دارد؛ تعداد ردیف اصلی را تغییر دهید.");

        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.Description)
                .NotEmpty()
                .MaximumLength(200);

            line.RuleFor(l => l.Quantity)
                .GreaterThan(0)
                .WithMessage("مقدار باید بیشتر از صفر باشد.");

            line.RuleFor(l => l.UnitPrice)
                .GreaterThanOrEqualTo(0)
                .WithMessage("قیمت واحد نمی‌تواند منفی باشد.");

            line.RuleFor(l => l.DiscountRate).InclusiveBetween(0m,100m);
            line.RuleFor(l => l.WithholdingRate).InclusiveBetween(0,100);

            line.RuleFor(l => l.VatRate)
                .InclusiveBetween(0, 100)
                .WithMessage("درصد مالیات باید بین صفر تا ۱۰۰ باشد.");
        });
    }

    private async Task<bool> ContactExistsAsync(int contactId, CancellationToken ct)
    {
        return await _db.Contacts.AnyAsync(c => c.Id == contactId, ct);
    }
}
