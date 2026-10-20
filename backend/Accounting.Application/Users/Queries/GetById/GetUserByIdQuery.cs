using Accounting.Application.Users.Queries.Dto;
using MediatR;

namespace Accounting.Application.Users.Queries.GetById;

public record GetUserByIdQuery(int Id) : IRequest<UserDetailDto>;
