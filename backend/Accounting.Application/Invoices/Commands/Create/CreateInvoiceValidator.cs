using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Validation;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Invoices.Commands.Create;

public class CreateInvoiceValidator : AbstractValidator<CreateInvoiceCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateInvoiceValidator(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;

        RuleFor(x => x.ContactId)
            .GreaterThan(0);

        RuleFor(x => x.DateUtc)
            .NotEmpty()
            .WithMessage("تاریخ الزامی است.");

        RuleFor(x => x.Notes).MaximumLength(2000).WithMessage("توضیحات حداکثر ۲۰۰۰ نویسه است.");

        RuleFor(x => x.Currency).MustBeValidCurrency();

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("نوع فاکتور نامعتبر است.");

        // 🆕 DocumentType validasyonu
        RuleFor(x => x.DocumentType)
            .IsInEnum()
            .When(x => x.DocumentType.HasValue)
            .WithMessage("نوع سند معتبر انتخاب کنید.");

        // Branch kontrolü
        RuleFor(x => x)
            .MustAsync(ContactBelongsToSameBranchAsync)
            .WithMessage("طرف حساب باید متعلق به شعبه فاکتور باشد.")
            .When(x => x.ContactId > 0 && _currentUserService.BranchId.HasValue);

        // Satırlar
        RuleFor(x => x.Lines)
            .NotNull()
            .Must(l => l.Count > 0)
            .WithMessage("ثبت حداقل یک ردیف الزامی است.");

        RuleFor(x => x.Lines).Must(lines => lines == null || lines.Where(l=>l.ItemId.HasValue).Select(l=>l.ItemId).Distinct().Count() == lines.Count(l=>l.ItemId.HasValue))
            .WithMessage("هر کالا فقط یک ردیف دارد؛ تعداد ردیف اصلی را تغییر دهید.");

        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            // 🆕 ItemId artık zorunlu (ExpenseDefinitionId yok)
            line.RuleFor(l => l.ItemId)
                .NotNull()
                .GreaterThan(0)
                .WithMessage("انتخاب کالا الزامی است.");

            line.RuleFor(l => l.Qty)
                .GreaterThan(0)
                .WithMessage("مقدار باید بیشتر از صفر باشد.");

            line.RuleFor(l => l.UnitPrice)
                .GreaterThanOrEqualTo(0)
                .WithMessage("قیمت واحد نمی‌تواند منفی باشد.");

            line.RuleFor(l => l.VatRate)
                .InclusiveBetween(0, 100);

            line.RuleFor(l => l.DiscountRate)
                .InclusiveBetween(0, 100)
                .When(l => l.DiscountRate.HasValue)
                .WithMessage("درصد تخفیف باید بین صفر و ۱۰۰ باشد.");
        });

        // Item'lar gerçekten var mı (Item artık global/branch-agnostic bir entity,
        // bu yüzden burada bir şube kıyaslaması değil, sadece varlık kontrolü yapılır).
        RuleFor(x => x)
            .MustAsync(AllItemsExistAsync)
            .WithMessage("یک یا چند کالای ردیف‌های فاکتور یافت نشد.")
            .When(x => x.Lines != null && x.Lines.Any());
    }

    private async Task<bool> ContactBelongsToSameBranchAsync(CreateInvoiceCommand cmd, CancellationToken ct)
    {
        // Admin/HQ users can invoice any branch's contact, same bypass ApplyBranchFilter
        // applies everywhere else — without this, an admin could never create an invoice
        // for a contact outside their own "home" branch.
        if (_currentUserService.IsAdmin || _currentUserService.IsHeadquarters) return true;

        if (!_currentUserService.BranchId.HasValue) return false;
        var currentBranchId = _currentUserService.BranchId.Value;

        var contact = await _db.Contacts
            .AsNoTracking()
            .Where(c => c.Id == cmd.ContactId && !c.IsDeleted)
            .Select(c => new { c.BranchId })
            .FirstOrDefaultAsync(ct);

        if (contact == null)
            return false;

        return contact.BranchId == currentBranchId;
    }

    private async Task<bool> AllItemsExistAsync(CreateInvoiceCommand cmd, CancellationToken ct)
    {
        var itemIds = cmd.Lines
            .Where(l => l.ItemId.HasValue)
            .Select(l => l.ItemId!.Value)
            .Distinct()
            .ToList();

        if (itemIds.Count == 0)
            return true;

        var existingCount = await _db.Items
            .AsNoTracking()
            .Where(i => itemIds.Contains(i.Id) && !i.IsDeleted)
            .CountAsync(ct);

        return existingCount == itemIds.Count;
    }
}
