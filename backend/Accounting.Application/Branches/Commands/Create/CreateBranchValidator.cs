using Accounting.Application.Branches.Commands.Create;
using Accounting.Application.Common.Abstractions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Branches.Commands.Create;

public class CreateBranchValidator : AbstractValidator<CreateBranchCommand>
{
    private readonly IAppDbContext _context;

    public CreateBranchValidator(IAppDbContext context)
    {
        _context = context;

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("کد شعبه الزامی است.")
            .MaximumLength(32).WithMessage("کد شعبه حداکثر ۳۲ نویسه است.")
            .MustAsync(BeUniqueCode).WithMessage("این کد شعبه قبلاً ثبت شده است.");

        RuleFor(x => x.LogoDataUrl).Must(Accounting.Application.Common.Validation.LogoValidation.IsValid)
            .WithMessage("لوگو باید تصویر PNG یا JPEG با حداکثر حجم ۳۰۰ کیلوبایت باشد.");
        RuleFor(x => x.Address).MaximumLength(500);
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("نام شعبه الزامی است.")
            .MaximumLength(128).WithMessage("نام شعبه حداکثر ۱۲۸ نویسه است.");
    }

    private async Task<bool> BeUniqueCode(string code, CancellationToken cancellationToken)
    {
        return !await _context.Branches
            .AnyAsync(x => x.Code == code, cancellationToken);
    }
}
