using Accounting.Application.Units.Queries;
using MediatR;

namespace Accounting.Application.Units.Commands.Update;

public record UpdateUnitCommand(
    int Id,
    string Name,
    string? Description,
    string RowVersion
) : IRequest<UnitDetailDto>;
