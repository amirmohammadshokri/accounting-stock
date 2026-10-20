using Accounting.Application.Common.Validation;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Orders.Commands.Create;

public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateOrderValidator(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;

        RuleFor(x => x.ContactId)
            .GreaterThan(0)
            .MustAsync(ContactIsValidForBranchAsync).WithMessage("طرف حساب یافت نشد یا متعلق به این شعبه نیست.");

        RuleFor(x => x.Type)
            .IsInEnum();            

        RuleFor(x => x.Currency)
            .MustBeValidCurrency();

        RuleFor(x => x.DateUtc)
            .NotEmpty();

        RuleFor(x => x.Description)
            .MaximumLength(200);

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

    private async Task<bool> ContactIsValidForBranchAsync(int contactId, CancellationToken ct)
    {
        var contact = await _db.Contacts
            .AsNoTracking()
            .Where(c => c.Id == contactId && !c.IsDeleted)
            .Select(c => new { c.BranchId })
            .FirstOrDefaultAsync(ct);

        if (contact == null) return false;

        // Admin/HQ bypass — same rule ApplyBranchFilter applies everywhere else.
        if (_currentUserService.IsAdmin || _currentUserService.IsHeadquarters) return true;

        if (!_currentUserService.BranchId.HasValue) return false;
        return contact.BranchId == _currentUserService.BranchId.Value;
    }
}
