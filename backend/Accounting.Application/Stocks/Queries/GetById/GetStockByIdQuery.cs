using Accounting.Application.Stocks.Queries.Dto;
using MediatR;

namespace Accounting.Application.Stocks.Queries.GetById;

public record GetStockByIdQuery(int Id) : IRequest<StockDetailDto>;
