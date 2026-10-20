using MediatR;

namespace Accounting.Application.Authentication.Common;

public sealed record SessionQuery(int UserId, string SessionId) : IRequest<SessionStatus?>;
public sealed record SessionActivityCommand(int UserId, string SessionId) : IRequest<SessionStatus?>;
public sealed record LogoutCommand(string RefreshToken) : IRequest;

public sealed class SessionRequestHandler(IUserSessionStore store) :
    IRequestHandler<SessionQuery, SessionStatus?>,
    IRequestHandler<SessionActivityCommand, SessionStatus?>,
    IRequestHandler<LogoutCommand>
{
    public Task<SessionStatus?> Handle(SessionQuery request, CancellationToken ct)
        => store.GetAsync(request.UserId, request.SessionId, false, ct);
    public Task<SessionStatus?> Handle(SessionActivityCommand request, CancellationToken ct)
        => store.GetAsync(request.UserId, request.SessionId, true, ct);
    public Task Handle(LogoutCommand request, CancellationToken ct)
        => store.RevokeAsync(request.RefreshToken, ct);
}
