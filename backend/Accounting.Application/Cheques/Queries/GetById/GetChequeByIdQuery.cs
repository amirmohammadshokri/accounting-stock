using Accounting.Application.Cheques.Queries.Dto;
using MediatR;

namespace Accounting.Application.Cheques.Queries.GetById;

public record GetChequeByIdQuery(int Id) : IRequest<ChequeDetailDto>;
