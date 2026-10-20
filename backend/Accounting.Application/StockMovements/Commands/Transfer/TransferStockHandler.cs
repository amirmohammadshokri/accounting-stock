using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Utils;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.StockMovements.Commands.Transfer;

public class TransferStockHandler(IAppDbContext db) : IRequestHandler<TransferStockCommand, StockTransferDetailDto>
{
    public async Task<StockTransferDetailDto> Handle(TransferStockCommand r, CancellationToken ct)
    {
        // 1. Validation & Parsing
        if (r.SourceWarehouseId == r.TargetWarehouseId)
            throw new BusinessRuleException("انبار مبدأ و مقصد نمی‌توانند یکسان باشند.");


        var qty = DecimalExtensions.RoundQuantity(r.Quantity);
        if (qty <= 0)
            throw new BusinessRuleException("مقدار انتقال باید بیشتر از صفر باشد.");

        // 2. Fetch Warehouses and validate existence
        var sourceWh = await db.Warehouses.FirstOrDefaultAsync(w => w.Id == r.SourceWarehouseId, ct)
             ?? throw new NotFoundException("Source Warehouse", r.SourceWarehouseId);

        var targetWh = await db.Warehouses.FirstOrDefaultAsync(w => w.Id == r.TargetWarehouseId, ct)
             ?? throw new NotFoundException("Target Warehouse", r.TargetWarehouseId);

        // 3. Validation: Branch Consistency
        // Item branch-specific olduğu için, şimdilik sadece aynı şube içi (veya item'ın ait olduğu şube) transferi destekleyelim.
        if (sourceWh.BranchId != targetWh.BranchId)
            throw new BusinessRuleException("انتقال کالا بین انبارهای شعبه‌های مختلف پشتیبانی نمی‌شود.");
        
        var branchId = sourceWh.BranchId;

        // 4. Validate Item
        var item = await db.Items.FirstOrDefaultAsync(i => i.Id == r.ItemId, ct)
            ?? throw new NotFoundException("Item", r.ItemId);

        // 5. Source Stock Check (Snapshot)
        var sourceStock = await db.Stocks.FirstOrDefaultAsync(s => 
            s.WarehouseId == r.SourceWarehouseId && 
            s.ItemId == r.ItemId && 
            s.BranchId == branchId, ct);

        if (sourceStock == null || sourceStock.Quantity < qty)
            throw new BusinessRuleException($"موجودی انبار مبدأ کافی نیست. موجودی: {(sourceStock?.Quantity ?? 0):N3}, درخواست‌شده: {qty:N3}");

        // 6. Target Stock (Snapshot) - Find or Create
        var targetStock = await db.Stocks.FirstOrDefaultAsync(s => 
            s.WarehouseId == r.TargetWarehouseId && 
            s.ItemId == r.ItemId && 
            s.BranchId == branchId, ct);

        if (targetStock == null)
        {
            targetStock = new Stock
            {
                BranchId = branchId,
                WarehouseId = r.TargetWarehouseId,
                ItemId = r.ItemId,
                Quantity = 0m,
                RowVersion = []
            };
            db.Stocks.Add(targetStock);
        }

        // 7. Update Balances
        // Optimistic concurrency (RowVersion) is handled by EF Core automatically if we had concurrency tokens on Read.
        // For Stock, we rely on SaveChanges throwing DbUpdateConcurrencyException if logic demands, 
        // but here we are doing direct modification. 
        // NOTE: In high concurrency, checking `sourceStock.Quantity < qty` in memory then saving might be race condition.
        // Ideally we use database constraints or strict optimistic concurrency.
        // For MVP, standard EF Core handling.

        sourceStock.Quantity = DecimalExtensions.RoundQuantity(sourceStock.Quantity - qty);
        targetStock.Quantity = DecimalExtensions.RoundQuantity(targetStock.Quantity + qty);

        // 8. Create Movements
        var now = r.TransactionDateUtc == default ? DateTime.UtcNow : r.TransactionDateUtc;
        var note = string.IsNullOrWhiteSpace(r.Description) ? "Transfer" : r.Description.Trim();

        var outMovement = new StockMovement
        {
            BranchId = branchId,
            WarehouseId = r.SourceWarehouseId,
            ItemId = r.ItemId,
            Type = StockMovementType.TransferOut,
            // Quantity is always the positive magnitude, same convention as CreateStockMovementHandler
            // (IsIn(Type) ? +qty : -qty is applied to the Stock snapshot, never to the stored Quantity).
            Quantity = qty,
            TransactionDateUtc = now,
            Note = $"{note} (To: {targetWh.Name})",
            RowVersion = []
        };

        var inMovement = new StockMovement
        {
            BranchId = branchId,
            WarehouseId = r.TargetWarehouseId,
            ItemId = r.ItemId,
            Type = StockMovementType.TransferIn,
            Quantity = qty,
            TransactionDateUtc = now,
            Note = $"{note} (From: {sourceWh.Name})",
            RowVersion = []
        };

        db.StockMovements.Add(outMovement);
        db.StockMovements.Add(inMovement);

        // 9. Save
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("موجودی هنگام انتقال تغییر کرده است؛ دوباره تلاش کنید.");
        }

        return new StockTransferDetailDto(true, outMovement.Id, inMovement.Id, "انتقال با موفقیت انجام شد.");
    }
}
