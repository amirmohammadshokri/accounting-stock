using MediatR;

namespace Accounting.Application.Users.Commands.Delete;

public record SoftDeleteUserCommand(int Id) : IRequest;
