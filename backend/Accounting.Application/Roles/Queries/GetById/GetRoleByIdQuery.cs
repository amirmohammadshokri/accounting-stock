using Accounting.Application.Roles.Queries.Dto;
using MediatR;

namespace Accounting.Application.Roles.Queries.GetById;

public record GetRoleByIdQuery(int Id) : IRequest<RoleDetailDto>;
