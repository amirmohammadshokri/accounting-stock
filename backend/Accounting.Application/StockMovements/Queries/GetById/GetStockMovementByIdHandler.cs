using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Utils;
using Accounting.Application.StockMovements.Queries.Dto;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.StockMovements.Queries.GetById;

public class GetStockMovementByIdHandler(IAppDbContext db, ICurrentUserService currentUserService) : IRequestHandler<GetStockMovementByIdQuery, StockMovementDetailDto>
{
    public async Task<StockMovementDetailDto> Handle(GetStockMovementByIdQuery r, CancellationToken ct)
    {
        var e = await db.StockMovements
            .AsNoTracking()
            .ApplyBranchFilter(currentUserService)
            .Include(x => x.Warehouse)
            .Include(x => x.Item).ThenInclude(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == r.Id, ct);

        if (e is null) throw new NotFoundException("StockMovement", r.Id);

        return new StockMovementDetailDto(
            e.Id,
            e.BranchId,
            e.WarehouseId,
            e.Warehouse.Code,
            e.ItemId,
            e.Item.Code,
            e.Item.Name,
            e.Item.Unit.Name,
            e.Type,
            e.Quantity,
            e.TransactionDateUtc,
            e.Note,
            Convert.ToBase64String(e.RowVersion),
            e.CreatedAtUtc,
            e.UpdatedAtUtc
        );
    }
}
