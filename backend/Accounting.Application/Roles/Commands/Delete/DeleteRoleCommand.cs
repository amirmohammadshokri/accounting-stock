using MediatR;

namespace Accounting.Application.Roles.Commands.Delete;

public record DeleteRoleCommand(int Id) : IRequest;
