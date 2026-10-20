using MediatR;

namespace Accounting.Application.Users.Commands.Create;

public record CreateUserCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    int? BranchId,
    bool IsActive,
    List<int> RoleIds
) : IRequest<int>;
