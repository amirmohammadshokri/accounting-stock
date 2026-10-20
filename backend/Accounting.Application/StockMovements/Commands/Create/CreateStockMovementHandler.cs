using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Utils;
using Accounting.Application.Services;
using Accounting.Application.StockMovements.Queries.Dto;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Accounting.Application.Common.Interfaces;

namespace Accounting.Application.StockMovements.Commands.Create;

public class CreateStockMovementHandler(IAppDbContext db, ICurrentUserService currentUserService) : IRequestHandler<CreateStockMovementCommand, StockMovementDetailDto>
{
    public async Task<StockMovementDetailDto> Handle(CreateStockMovementCommand r, CancellationToken ct)
    {
        if (r.Type == Accounting.Domain.Enums.StockMovementType.OpeningBalance) throw new BusinessRuleException("برای ثبت اول دوره از بخش اطلاعات اول دوره استفاده کنید.");
        var branchId = currentUserService.BranchId ?? throw new UnauthorizedAccessException();

        // stokta 3 ondalık yeterli (kg/lt)
        var qty = DecimalExtensions.RoundQuantity(r.Quantity);
        if (qty <= 0) throw new BusinessRuleException("مقدار باید بیشتر از صفر باشد.");

        // Warehouse kontrolü (şube uyumu da dahil)
        var wh = await db.Warehouses.FirstOrDefaultAsync(x =>
            x.Id == r.WarehouseId && x.BranchId == branchId, ct);

        if (wh is null) throw new NotFoundException("Warehouse", r.WarehouseId);

        // Item kontrolü (şube uyumu)
        var item = await db.Items.FirstOrDefaultAsync(x =>
            x.Id == r.ItemId, ct);

        if (item is null) throw new NotFoundException("Item", r.ItemId);

        // snapshot (Stock) bul/yoksa oluştur
        var stock = await db.Stocks.FirstOrDefaultAsync(x =>
            x.BranchId == branchId &&
            x.WarehouseId == r.WarehouseId &&
            x.ItemId == r.ItemId, ct);

        if (stock is null)
        {
            stock = new Stock
            {
                BranchId = branchId,
                WarehouseId = r.WarehouseId,
                ItemId = r.ItemId,
                Quantity = 0m
            };
            db.Stocks.Add(stock);
        }

        // yön belirle (In/Out) ve negatife düşmeyi engelle: StockQuantityCalculator
        // hem burada hem CreateInvoiceHandler'ın toplu senkronizasyonunda kullanılıyor.
        var newQty = StockQuantityCalculator.ApplyMovement(stock.Quantity, r.Type, qty);

        var trxDate = r.TransactionDateUtc ?? DateTime.UtcNow;

        var movement = new StockMovement
        {
            BranchId = branchId,
            WarehouseId = r.WarehouseId,
            ItemId = r.ItemId,
            InvoiceId = r.InvoiceId, // Fatura kaynaklı hareketler için
            Type = r.Type,
            Quantity = qty,
            TransactionDateUtc = trxDate,
            Note = string.IsNullOrWhiteSpace(r.Note) ? null : r.Note.Trim()
        };

        db.StockMovements.Add(movement);

        // snapshot güncelle
        stock.Quantity = newQty;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            // aynı anda hareket girildiyse stock rowversion çakışabilir
            throw new ConcurrencyConflictException("موجودی هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.");
        }

        // fresh read (DTO için join'li)
        var saved = await db.StockMovements
            .AsNoTracking()
            .Include(x => x.Warehouse)
            .Include(x => x.Item).ThenInclude(x => x.Unit)
            .FirstAsync(x => x.Id == movement.Id, ct);

        return new StockMovementDetailDto(
            saved.Id,
            saved.BranchId,
            saved.WarehouseId,
            saved.Warehouse.Code,
            saved.ItemId,
            saved.Item.Code,
            saved.Item.Name,
            saved.Item.Unit.Name,
            saved.Type,
            saved.Quantity,
            saved.TransactionDateUtc,
            saved.Note,
            Convert.ToBase64String(saved.RowVersion),
            saved.CreatedAtUtc,
            saved.UpdatedAtUtc
        );
    }
}
