using FluentValidation;

namespace Accounting.Application.CompanySettings.Commands.Update;

public class UpdateCompanySettingsValidator : AbstractValidator<UpdateCompanySettingsCommand>
{
    public UpdateCompanySettingsValidator()
    {
        RuleFor(x => x.NationalId).Matches(@"^[0-9]{10,11}$").When(x => !string.IsNullOrWhiteSpace(x.NationalId));
        RuleFor(x => x.PostalCode).Matches(@"^[0-9]{10}$").When(x => !string.IsNullOrWhiteSpace(x.PostalCode));
        RuleFor(x => x.LogoUrl).Must(value => Accounting.Application.Common.Validation.LogoValidation.IsValid(value)
            || (value?.Length <= 500 && Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == "http" || uri.Scheme == "https")))
            .WithMessage("تصویر لوگو معتبر نیست؛ فایل PNG یا JPEG تا ۳۰۰ کیلوبایت پیوست کنید.");
        RuleFor(x => x.Id).GreaterThan(0);

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("نام شرکت الزامی است.")
            .MaximumLength(200).WithMessage("نام شرکت حداکثر ۲۰۰ نویسه است.");

        RuleFor(x => x.TaxNumber)
            .NotEmpty().WithMessage("شماره اقتصادی الزامی است.")
            .MaximumLength(20).WithMessage("شماره اقتصادی حداکثر ۲۰ نویسه است.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("قالب ایمیل معتبر نیست.");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("شماره تلفن بیش از حد طولانی است.");
    }
}
