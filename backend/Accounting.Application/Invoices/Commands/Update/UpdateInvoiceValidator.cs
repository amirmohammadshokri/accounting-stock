using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Validation;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Accounting.Application.Common.Interfaces;

namespace Accounting.Application.Invoices.Commands.Update;

public sealed class UpdateInvoiceValidator : AbstractValidator<UpdateInvoiceCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateInvoiceValidator(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;

        RuleFor(x => x.Id).GreaterThan(0);

        RuleFor(x => x.RowVersionBase64).MustBeValidRowVersion();

        RuleFor(x => x.DateUtc)
            .Must(d => d.Kind == DateTimeKind.Utc || d.Kind == DateTimeKind.Unspecified)
            .WithMessage("تاریخ باید معتبر باشد.");

        RuleFor(x => x.Notes).MaximumLength(2000).WithMessage("توضیحات حداکثر ۲۰۰۰ نویسه است.");

        RuleFor(x => x.Currency).NotEmpty().Length(3); // The handler preserves the stored currency, including historical records.

        RuleFor(x => x.ContactId).GreaterThan(0);

        RuleFor(x => x.Lines)
            .NotNull().WithMessage("ردیف‌ها باید ارسال شوند.")
            .Must(l => l != null && l.Count > 0).WithMessage("ثبت حداقل یک ردیف الزامی است.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("نوع فاکتور نامعتبر است.");

        // Branch Tutarlılık Kontrolü: Contact aynı şubeye ait olmalı
        RuleFor(x => x)
            .MustAsync(ContactBelongsToSameBranchAsync)
            .WithMessage("طرف حساب باید متعلق به شعبه فاکتور باشد.");

        // Item'lar gerçekten var mı (Item artık global/branch-agnostic bir entity,
        // bu yüzden burada bir şube kıyaslaması değil, sadece varlık kontrolü yapılır).
        RuleFor(x => x)
            .MustAsync(AllItemsExistAsync)
            .WithMessage("یک یا چند کالای ردیف‌های فاکتور یافت نشد.");

        // Id>0 olan satırlarda tekrar kontrolü
        RuleFor(x => x.Lines)
            .Must(lines =>
            {
                var ids = lines.Where(l => l.Id > 0).Select(l => l.Id);
                return ids.Distinct().Count() == ids.Count();
            })
            .WithMessage("شناسه ردیف‌های درخواست تکراری است.");

        RuleFor(x => x.Lines).Must(lines => lines == null || lines.Where(l=>l.ItemId.HasValue).Select(l=>l.ItemId).Distinct().Count() == lines.Count(l=>l.ItemId.HasValue))
            .WithMessage("هر کالا فقط یک ردیف دارد؛ تعداد ردیف اصلی را تغییر دهید.");

        RuleForEach(x => x.Lines).SetValidator(new UpdateInvoiceLineValidator());
    }

    private async Task<bool> ContactBelongsToSameBranchAsync(UpdateInvoiceCommand cmd, CancellationToken ct)
    {
        // Admin/HQ users can update any branch's invoice, same bypass ApplyBranchFilter
        // applies everywhere else — without this, an admin could never update an invoice
        // for a contact outside their own "home" branch (found via manual UI testing:
        // editing invoice #2, whose contact belongs to a different branch than the admin
        // account's own branch, failed validation every time).
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

    private async Task<bool> AllItemsExistAsync(UpdateInvoiceCommand cmd, CancellationToken ct)
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

internal sealed class UpdateInvoiceLineValidator : AbstractValidator<UpdateInvoiceLineDto>
{
    public UpdateInvoiceLineValidator()
    {
        RuleFor(l => l.Id).GreaterThanOrEqualTo(0);
        RuleFor(l => l.ItemId).GreaterThan(0).When(l => l.ItemId.HasValue);

        RuleFor(l => l.Qty)
            .GreaterThan(0)
            .WithMessage("مقدار باید بیشتر از صفر باشد.");

        RuleFor(l => l.UnitPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("قیمت واحد نمی‌تواند منفی باشد.");

        RuleFor(l => l.VatRate).InclusiveBetween(0, 100);

        RuleFor(l => l.DiscountRate)
            .InclusiveBetween(0, 100)
            .When(l => l.DiscountRate.HasValue)
            .WithMessage("درصد تخفیف باید بین صفر و ۱۰۰ باشد.");
    }
}
