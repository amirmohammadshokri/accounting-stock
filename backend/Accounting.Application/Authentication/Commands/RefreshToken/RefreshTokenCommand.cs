using Accounting.Application.Authentication.Common;
using MediatR;

namespace Accounting.Application.Authentication.Commands.RefreshToken;

public record RefreshTokenCommand(
    string AccessToken,
    string RefreshToken
) : IRequest<AuthenticationResult>;
