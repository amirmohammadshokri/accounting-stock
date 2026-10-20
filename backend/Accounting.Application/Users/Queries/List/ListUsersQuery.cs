using Accounting.Application.Common.Models;
using Accounting.Application.Users.Queries.Dto;
using MediatR;

namespace Accounting.Application.Users.Queries.List;

public record ListUsersQuery(
    int Page = 1,
    int PageSize = 20,
    int? BranchId = null,
    int? RoleId = null,
    bool? IsActive = null,
    string? Search = null
) : IRequest<PagedResult<UserListItemDto>>;
