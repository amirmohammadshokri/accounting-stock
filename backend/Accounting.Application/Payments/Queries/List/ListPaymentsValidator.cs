using Accounting.Application.Common.Validation;
using FluentValidation;

namespace Accounting.Application.Payments.Queries.List;

public class ListPaymentsValidator : AbstractValidator<ListPaymentsQuery>
{
    public ListPaymentsValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 200);

        RuleFor(x => x.Sort)
            .Must(BeValidSort)
            .WithMessage("مرتب‌سازی باید بر اساس dateUtc یا amount با جهت asc یا desc باشد.");

        RuleFor(x => x.Currency)
            .Must(c => string.IsNullOrWhiteSpace(c) || CommonValidationRules.IsValidCurrency(c))
            .WithMessage("فقط ریال ایران (IRR) پشتیبانی می‌شود.");

        // Tarihleri opsiyonel bÄ±rakÄ±yoruz; varsa ISO-8601 olmalÄ±
        RuleFor(x => x.DateFromUtc)
            .Must(BeIso8601OrNull).WithMessage("تاریخ شروع باید در قالب ISO-8601 باشد؛ مانند 2025-08-08T10:00:00Z.");
        RuleFor(x => x.DateToUtc)
            .Must(BeIso8601OrNull).WithMessage("تاریخ پایان باید در قالب ISO-8601 باشد؛ مانند 2025-08-08T10:00:00Z.");
    }

    private static bool BeValidSort(string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort)) return true;
        var parts = sort.Split(':');
        if (parts.Length != 2) return false;
        var field = parts[0].ToLowerInvariant();
        var dir = parts[1].ToLowerInvariant();
        return (field is "dateutc" or "amount") && (dir is "asc" or "desc");
    }

    private static bool BeIso8601OrNull(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return true;
        return DateTime.TryParse(s, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AdjustToUniversal, out _);
    }
}
