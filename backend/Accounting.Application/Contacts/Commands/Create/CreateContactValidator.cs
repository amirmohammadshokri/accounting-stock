using Accounting.Domain.Enums;
using FluentValidation;

namespace Accounting.Application.Contacts.Commands.Create;

public class CreateContactValidator : AbstractValidator<CreateContactCommand>
{
    public CreateContactValidator()
    {
        RuleFor(x => x.NationalId).Matches(@"^[0-9]{10,11}$").When(x => !string.IsNullOrWhiteSpace(x.NationalId));
        RuleFor(x => x.PostalCode).Matches(@"^[0-9]{10}$").When(x => !string.IsNullOrWhiteSpace(x.PostalCode));
        RuleFor(x => x.BranchId).GreaterThan(0);
        
        RuleFor(x => x.SubscriptionNumber).Must(SubscriptionNumbers.IsValid).WithMessage("شماره اشتراک باید حداکثر ۳۲ حرف انگلیسی، عدد یا خط تیره باشد؛ پیشوند AUTO- مخصوص شماره خودکار است.");
        // Common
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200).When(x => x.CompanyDetails != null);

        // Company Validation (If params provided)
        RuleFor(x => x.CompanyDetails!.TaxNumber).MaximumLength(20).When(x => x.CompanyDetails != null);
        RuleFor(x => x.CompanyDetails!.TaxOffice).MaximumLength(100).When(x => x.CompanyDetails != null);
        RuleFor(x => x.CompanyDetails!.MersisNo).MaximumLength(20).When(x => x.CompanyDetails != null);
        RuleFor(x => x.CompanyDetails!.TicaretSicilNo).MaximumLength(20).When(x => x.CompanyDetails != null);

        // Person Validation (If params provided)
        RuleFor(x => x.PersonDetails!.Tckn).Length(10).When(x => x.PersonDetails != null && !string.IsNullOrWhiteSpace(x.PersonDetails.Tckn));
        RuleFor(x => x.PersonDetails!.FirstName).NotEmpty().MaximumLength(100).When(x => x.PersonDetails != null);
        RuleFor(x => x.PersonDetails!.LastName).NotEmpty().MaximumLength(100).When(x => x.PersonDetails != null);
        RuleFor(x => x.PersonDetails!.Title).MaximumLength(100).When(x => x.PersonDetails != null);
        RuleFor(x => x.PersonDetails!.Department).MaximumLength(100).When(x => x.PersonDetails != null);

        // Employee MUST have PersonDetails
        RuleFor(x => x.PersonDetails).NotNull().When(x => x.IsEmployee)
            .WithMessage("ثبت کارمند نیازمند تکمیل مشخصات شخص حقیقی است.");

        // IsRetail=true can NOT be IsCustomer=true
        RuleFor(x => x.IsCustomer).Equal(false).When(x => x.IsRetail)
            .WithMessage("مشتری خرده‌فروشی نمی‌تواند هم‌زمان مشتری سازمانی باشد.");

        // At least ONE detail must be present (Company OR Person)
        RuleFor(x => x).Must(x => x.CompanyDetails != null || x.PersonDetails != null)
            .WithMessage("حداقل مشخصات شخص حقیقی یا شرکت را برای طرف حساب تکمیل کنید.");
    }
}
