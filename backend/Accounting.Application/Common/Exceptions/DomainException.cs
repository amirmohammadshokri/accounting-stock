namespace Accounting.Application.Common.Exceptions;

public abstract class DomainException : Exception
{
    public string Code { get; } // machine-readable error code
    protected DomainException(string code, string message) : base(message) => Code = code;
}
