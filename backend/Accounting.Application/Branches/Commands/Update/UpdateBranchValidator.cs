using Accounting.Application.Common.Abstractions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Branches.Commands.Update;

public class UpdateBranchValidator : AbstractValidator<UpdateBranchCommand>
{
    private readonly IAppDbContext _context;

    public UpdateBranchValidator(IAppDbContext context)
    {
        _context = context;

        RuleFor(x => x.Id).GreaterThan(0);

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
        
        RuleFor(x => x.RowVersionBase64).NotEmpty().WithMessage("نسخه رکورد الزامی است.");
    }

    private async Task<bool> BeUniqueCode(UpdateBranchCommand command, string code, CancellationToken cancellationToken)
    {
        // Kendisi hariç diğerlerinde ara
        return !await _context.Branches
            .AnyAsync(x => x.Code == code && x.Id != command.Id, cancellationToken);
    }
}
