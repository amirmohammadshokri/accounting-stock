using Accounting.Application.CashBankAccounts.Queries.Dto;
using MediatR;

namespace Accounting.Application.CashBankAccounts.Queries.GetById;

public record GetCashBankAccountByIdQuery(int Id) : IRequest<CashBankAccountDetailDto>;
