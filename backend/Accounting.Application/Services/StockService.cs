using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Services;

public class StockService(IAppDbContext db, ICurrentUserService currentUserService) : IStockService
{
    public async Task<List<ItemStockDto>> GetStockStatusAsync(List<int> itemIds, CancellationToken ct)
    {
        // Physical on-hand quantity: the Stock snapshot table, kept in sync by every
        // StockMovement (purchases, sales, returns, adjustments, transfers). This is the
        // single source of truth for "how much do we actually have" — unlike the old
        // implementation, which re-derived a number purely from InvoiceLines/OrderLines
        // and silently ignored opening-stock/adjustment/transfer movements, so it could
        // (and did) disagree with the real Stock table by a wide margin.
        var onHandByItem = await db.Stocks
            .AsNoTracking()
            .ApplyBranchFilter(currentUserService)
            .Where(s => itemIds.Contains(s.ItemId))
            .GroupBy(s => s.ItemId)
            .Select(g => new { ItemId = g.Key, Quantity = g.Sum(s => s.Quantity) })
            .ToListAsync(ct);

        // Admin/HQ see every branch (same rule as ApplyBranchFilter); a regular branch
        // user only sees their own branch's documents.
        var seeAllBranches = currentUserService.IsAdmin || currentUserService.IsHeadquarters;
        var callerBranchId = currentUserService.BranchId;

        // Informational cumulative totals for the stock-status report (not used for
        // availability checks below — QuantityAvailable is what those rely on).
        var invoiceLines = await db.InvoiceLines
            .AsNoTracking()
            .Include(l => l.Item)
            .Where(l => l.ItemId.HasValue
                && itemIds.Contains(l.ItemId.Value)
                && l.Item != null
                && l.Item.Type == ItemType.Inventory
                && (seeAllBranches || l.Invoice.BranchId == callerBranchId))
            .Select(l => new { l.ItemId, l.Invoice.Type, l.Qty })
            .ToListAsync(ct);

        // Reserved: approved Sales orders not yet converted to an invoice.
        var reservedLines = await db.OrderLines
            .AsNoTracking()
            .Include(l => l.Item)
            .Where(l => l.ItemId.HasValue
                && itemIds.Contains(l.ItemId.Value)
                && l.Order.Type == InvoiceType.Sales
                && l.Order.Status == OrderStatus.Approved
                && l.Item != null
                && l.Item.Type == ItemType.Inventory
                && (seeAllBranches || l.Order.BranchId == callerBranchId))
            .Select(l => new { l.ItemId, l.Quantity })
            .ToListAsync(ct);

        var result = new List<ItemStockDto>();

        foreach (var itemId in itemIds)
        {
            var ins = invoiceLines.Where(x => x.ItemId == itemId && x.Type == InvoiceType.Purchase).Sum(x => x.Qty);
            var outs = invoiceLines.Where(x => x.ItemId == itemId && x.Type == InvoiceType.Sales).Sum(x => x.Qty);
            var reserved = reservedLines.Where(x => x.ItemId == itemId).Sum(x => x.Quantity);
            var onHand = onHandByItem.FirstOrDefault(x => x.ItemId == itemId)?.Quantity ?? 0m;

            var available = onHand - reserved;

            result.Add(new ItemStockDto(itemId, ins, outs, reserved, available));
        }

        return result;
    }

    public async Task<ItemStockDto> GetItemStockAsync(int itemId, CancellationToken ct)
    {
        var list = await GetStockStatusAsync(new List<int> { itemId }, ct);
        return list[0];
    }

    public async Task ValidateStockAvailabilityAsync(int itemId, decimal quantityRequired, CancellationToken ct)
    {
        var item = await db.Items
            .AsNoTracking()
            .Where(i => i.Id == itemId && !i.IsDeleted)
            .Select(i => new { i.Type })
            .FirstOrDefaultAsync(ct);

        if (item == null)
            throw new NotFoundException("Item", itemId);

    }

    public async Task ValidateBatchStockAvailabilityAsync(Dictionary<int, decimal> stockRequirements, CancellationToken ct)
    {
        if (stockRequirements == null || stockRequirements.Count == 0)
            return;

        var itemIds = stockRequirements.Keys.ToList();

        var items = await db.Items
            .AsNoTracking()
            .Where(i => itemIds.Contains(i.Id) && !i.IsDeleted)
            .Select(i => new { i.Id, i.Type })
            .ToListAsync(ct);

        foreach (var id in itemIds)
            if (!items.Any(i => i.Id == id)) throw new NotFoundException("Item", id);
    }
}
