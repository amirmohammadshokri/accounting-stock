using MediatR;

namespace Accounting.Application.Roles.Commands.Update;

public record UpdateRoleCommand(
    int Id,
    string Name,
    string? Description,
    List<string> Permissions
) : IRequest;
