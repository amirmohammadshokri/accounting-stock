using Accounting.Application.Units.Queries;
using MediatR;

namespace Accounting.Application.Units.Commands.Create;

public record CreateUnitCommand(
    string Name,
    string? Description
) : IRequest<UnitDetailDto>;
