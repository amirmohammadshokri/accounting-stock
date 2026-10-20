using MediatR;

namespace Accounting.Application.Roles.Commands.Create;

public record CreateRoleCommand(
    string Name,
    string? Description,
    List<string> Permissions = null!
) : IRequest<int>
{
    public List<string> Permissions { get; init; } = Permissions ?? new List<string>();
}
