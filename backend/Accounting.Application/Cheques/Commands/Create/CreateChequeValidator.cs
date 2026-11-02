using Accounting.Application.Common.Validation;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Cheques.Commands.Create;

public class CreateChequeValidator : AbstractValidator<CreateChequeCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateChequeValidator(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;

        // RuleFor(x => x.BranchId).GreaterThan(0); // Removed
        RuleFor(x => x.ChequeNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Currency).MustBeValidCurrency();
        RuleFor(x => x.DueDate).GreaterThanOrEqualTo(x => x.IssueDate).WithMessage("تاریخ سررسید نمی‌تواند قبل از تاریخ صدور باشد.");

        // Müşteri çeki ise Contact zorunlu
        RuleFor(x => x.ContactId)
            .NotEmpty()
            .When(x => x.Direction == ChequeDirection.Inbound)
            .WithMessage("برای ثبت سند مشتری، انتخاب طرف حساب الزامی است.");

        // Contact Branch Consistency
        RuleFor(x => x)
            .MustAsync(ContactBelongsToSameBranchAsync)
            .WithMessage("طرف حساب انتخاب‌شده متعلق به این شعبه نیست.")
            .When(x => x.ContactId.HasValue);
    }

    private async Task<bool> ContactBelongsToSameBranchAsync(CreateChequeCommand cmd, CancellationToken ct)
    {
        return await _db.Contacts.AnyAsync(c => c.Id == cmd.ContactId, ct);
    }
}
