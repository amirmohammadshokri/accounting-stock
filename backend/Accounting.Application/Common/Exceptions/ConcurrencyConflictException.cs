namespace Accounting.Application.Common.Exceptions;

public sealed class ConcurrencyConflictException : DomainException
{
    public ConcurrencyConflictException(string message = "اطلاعات توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.")
        : base("concurrency_conflict", message) { }
}
