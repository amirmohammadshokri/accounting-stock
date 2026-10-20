using Accounting.Application.Roles.Queries.Dto;
using MediatR;

namespace Accounting.Application.Roles.Queries.List;

public record ListRolesQuery : IRequest<List<RoleListItemDto>>;
