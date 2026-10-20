namespace Accounting.Application.Common.Exceptions;
public sealed class ForbiddenAccessException(string message="اجازه دسترسی به این بخش را ندارید.") : DomainException("forbidden",message);
