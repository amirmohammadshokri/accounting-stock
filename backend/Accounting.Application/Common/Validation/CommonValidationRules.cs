using Accounting.Application.Common.Utils;
using FluentValidation;

namespace Accounting.Application.Common.Validation;

/// <summary>
/// Tüm validator'larda kullanılabilecek ortak validation kuralları
/// </summary>
public static class CommonValidationRules
{
    // ========== Allowed Values ==========

    /// <summary>
    /// Desteklenen para birimleri (ISO-4217)
    /// </summary>
    public static readonly string[] AllowedCurrencies = { "IRR" };

    public static string PreserveExistingCurrency(string? requested, string existing)
    {
        if (!string.Equals(requested?.Trim(), existing.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("واحد پول سوابق قابل تغییر نیست؛ ثبت جدید فقط با ریال انجام می‌شود.");
        return existing;
    }

    // ========== Helper Methods for Handlers ==========

    /// <summary>
    /// Currency kodunu normalize et ve validate et.
    /// Handler'larda kullanım için.
    /// </summary>
    /// <param name="currency">Input currency (nullable)</param>
    /// <param name="defaultCurrency">Default değer (varsayılan: IRR)</param>
    /// <returns>Normalized uppercase currency code</returns>
    /// <exception cref="FluentValidation.ValidationException">Geçersiz currency</exception>
    public static string NormalizeAndValidateCurrency(string? currency, string defaultCurrency = "IRR")
    {
        var normalized = (currency ?? defaultCurrency).Trim().ToUpperInvariant();

        if (!AllowedCurrencies.Contains(normalized))
            throw new ValidationException("فقط ریال ایران (IRR) پشتیبانی می‌شود.");

        return normalized;
    }

    /// <summary>
    /// Currency kodunun geçerli olup olmadığını kontrol et (exception fırlatmadan)
    /// </summary>
    public static bool IsValidCurrency(string? currency)
    {
        if (string.IsNullOrWhiteSpace(currency)) return false;
        return AllowedCurrencies.Contains(currency.Trim().ToUpperInvariant());
    }

    /// <summary>
    /// Currency code validation (ISO-4217 whitelist)
    /// </summary>
    public static IRuleBuilderOptions<T, string?> MustBeValidCurrency<T>(
        this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .NotEmpty()
            .Must(BeValidCurrency)
            .WithMessage("«{PropertyName}» باید ریال ایران (IRR) باشد.");
    }

    /// <summary>
    /// RowVersion Base64 validation
    /// </summary>
    public static IRuleBuilderOptions<T, string?> MustBeValidRowVersion<T>(
        this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .NotEmpty()
            .Must(BeValidBase64)
            .WithMessage("«{PropertyName}» باید در قالب معتبر Base64 باشد.");
    }

    // ========== Private Helper Methods ==========

    private static bool BeValidCurrency(string? currency)
    {
        if (string.IsNullOrWhiteSpace(currency)) return false;
        return AllowedCurrencies.Contains(currency.Trim().ToUpperInvariant());
    }

    private static bool BeValidBase64(string? base64)
    {
        if (string.IsNullOrWhiteSpace(base64)) return false;

        try
        {
            Convert.FromBase64String(base64);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}