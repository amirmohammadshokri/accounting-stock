using MediatR;

namespace Accounting.Application.Users.Commands.ChangePassword;

public record ChangeUserPasswordCommand(
    int UserId,
    string NewPassword
) : IRequest;
