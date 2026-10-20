using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
namespace Accounting.Application.Contacts;

public static class SubscriptionNumbers
{
    public static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null :
        string.Concat(value.Trim().Select(c => c is >= '۰' and <= '۹' ? (char)('0'+c-'۰') : c is >= '٠' and <= '٩' ? (char)('0'+c-'٠') : c)).ToUpperInvariant();
    public static string Display(int id, string? value) => value ?? $"AUTO-{id:D6}";
    public static bool IsValid(string? value)
    {
        var normalized=Normalize(value);
        return normalized is null || (normalized.Length <= 32 && !normalized.StartsWith("AUTO-", StringComparison.Ordinal) &&
            normalized.All(c => c is >= 'A' and <= 'Z' or >= '0' and <= '9' or '-'));
    }
    public static async Task<string?> EnsureAvailable(IAppDbContext db, string? value, int id, CancellationToken ct)
    {
        if (!IsValid(value)) throw new BusinessRuleException("شماره اشتراک معتبر نیست.");
        var normalized=Normalize(value);
        // Uniqueness spans all branches and archived contacts; never expose another branch's data.
        if (normalized != null && await db.Contacts.IgnoreQueryFilters().AnyAsync(x=>x.Id!=id && x.SubscriptionNumber==normalized,ct))
            throw new BusinessRuleException("این شماره اشتراک قبلاً ثبت شده است؛ شماره دیگری وارد کنید.");
        return normalized;
    }
}
