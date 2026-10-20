using MediatR;

namespace Accounting.Application.CashBankAccounts.Commands.Delete;

public record SoftDeleteCashBankAccountCommand(int Id, string RowVersion) : IRequest<bool>;
