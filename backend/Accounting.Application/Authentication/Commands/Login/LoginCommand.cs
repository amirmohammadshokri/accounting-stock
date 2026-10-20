using Accounting.Application.Authentication.Common;
using MediatR;

namespace Accounting.Application.Authentication.Commands.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthenticationResult>;
