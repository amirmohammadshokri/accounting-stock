using MediatR;

namespace Accounting.Application.Users.Commands.Update;

public record UpdateUserCommand(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    int? BranchId,
    bool IsActive,
    List<int> RoleIds
) : IRequest;
