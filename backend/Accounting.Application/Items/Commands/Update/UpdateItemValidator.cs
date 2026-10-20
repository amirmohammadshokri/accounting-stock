using Accounting.Application.Common.Abstractions;
using Microsoft.EntityFrameworkCore;
using Accounting.Domain.Enums;
using FluentValidation;

namespace Accounting.Application.Items.Commands.Update;

public class UpdateItemValidator : AbstractValidator<UpdateItemCommand>
{
    public UpdateItemValidator(IAppDbContext db)
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.UnitId).GreaterThan(0)
            .MustAsync((id, ct) => db.Units.AsNoTracking().AnyAsync(u => u.Id == id, ct))
            .WithMessage("یک واحد اندازه‌گیری موجود و فعال انتخاب کنید.");
        RuleFor(x => x.VatRate).InclusiveBetween(0, 100);

        RuleFor(x => x.DefaultWithholdingRate)
            .InclusiveBetween(0, 100)
            .When(x => x.DefaultWithholdingRate.HasValue);

        RuleFor(x => x.PurchasePrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.PurchasePrice.HasValue);

        RuleFor(x => x.SalesPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.SalesPrice.HasValue);

        RuleFor(x => x.PurchaseAccountCode)
            .MaximumLength(16)
            .When(x => !string.IsNullOrEmpty(x.PurchaseAccountCode));

        RuleFor(x => x.SalesAccountCode)
            .MaximumLength(16)
            .When(x => !string.IsNullOrEmpty(x.SalesAccountCode));

        RuleFor(x => x.UsefulLifeYears)
            .GreaterThan(0)
            .LessThanOrEqualTo(50)
            .When(x => x.Type == ItemType.FixedAsset && x.UsefulLifeYears.HasValue)
            .WithMessage("عمر مفید دارایی ثابت باید بین ۱ تا ۵۰ سال باشد.");
    }
}
