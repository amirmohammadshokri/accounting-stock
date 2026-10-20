using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Utils;
using Accounting.Application.Stocks.Queries.Dto;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Stocks.Queries.GetById;

public class GetStockByIdHandler(IAppDbContext db, ICurrentUserService currentUserService) : IRequestHandler<GetStockByIdQuery, StockDetailDto>
{
    public async Task<StockDetailDto> Handle(GetStockByIdQuery r, CancellationToken ct)
    {
        var e = await db.Stocks
            .AsNoTracking()
            .ApplyBranchFilter(currentUserService)
            .Include(x => x.Warehouse)
            .Include(x => x.Item).ThenInclude(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == r.Id, ct);

        if (e is null) throw new NotFoundException("Stock", r.Id);

        return new StockDetailDto(
            e.Id,
            e.BranchId,
            e.WarehouseId,
            e.Warehouse.Code,
            e.Warehouse.Name,
            e.ItemId,
            e.Item.Code,
            e.Item.Name,
            e.Item.Unit.Name,
            e.Quantity,
            Convert.ToBase64String(e.RowVersion),
            e.CreatedAtUtc,
            e.UpdatedAtUtc
        );
    }
}
