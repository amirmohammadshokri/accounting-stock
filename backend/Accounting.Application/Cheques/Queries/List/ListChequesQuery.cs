using Accounting.Application.Cheques.Queries.Dto;
using Accounting.Application.Common.Models;
using MediatR;

namespace Accounting.Application.Cheques.Queries.List;

public record ListChequesQuery(
    int Page = 1,
    int PageSize = 20,
    string? Status = null,
    string? Type = null,
    string? Direction = null
) : IRequest<PagedResult<ChequeDetailDto>>;
