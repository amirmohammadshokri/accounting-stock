using Accounting.Application.Units.Queries;
using MediatR;

namespace Accounting.Application.Units.Queries.GetById;

public record GetUnitByIdQuery(int Id) : IRequest<UnitDetailDto>;
