using Accounting.Application.CashBankAccounts.Queries.Dto;
using Accounting.Application.Common.Constants;
using Accounting.Application.Common.Models;
using MediatR;

namespace Accounting.Application.CashBankAccounts.Queries.List;

public enum CashBankAccountTypeFilter { Any = 0, Cash = 1, Bank = 2 }

public record ListCashBankAccountsQuery(
    int? BranchId = null,
    int PageNumber = PaginationConstants.DefaultPage,
    int PageSize = PaginationConstants.DefaultPageSize,
    string? Sort = "name:asc",
    CashBankAccountTypeFilter Type = CashBankAccountTypeFilter.Any,
    string? Search = null,
    string? IbanStartsWith = null
) : IRequest<PagedResult<CashBankAccountListItemDto>>;
