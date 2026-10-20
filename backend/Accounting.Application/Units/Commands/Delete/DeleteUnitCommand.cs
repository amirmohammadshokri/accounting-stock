using MediatR;

namespace Accounting.Application.Units.Commands.Delete;

public record DeleteUnitCommand(int Id, string RowVersion) : IRequest<bool>;
