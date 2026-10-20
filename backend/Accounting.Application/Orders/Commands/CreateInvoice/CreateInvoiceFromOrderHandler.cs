using Accounting.Application.Common.Validation;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Accounting.Application.Common.Interfaces;

namespace Accounting.Application.Orders.Commands.CreateInvoice;



public class CreateInvoiceFromOrderHandler : IRequestHandler<CreateInvoiceFromOrderCommand, int>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateInvoiceFromOrderHandler(IAppDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }
    public async Task<int> Handle(CreateInvoiceFromOrderCommand r, CancellationToken ct)
    {
        var order = await _db.Orders
            .ApplyBranchFilter(_currentUserService)
            .Include(o => o.Lines.Where(l => !l.IsDeleted))
                .ThenInclude(l => l.Item)
                    .ThenInclude(i => i!.Unit)
            .FirstOrDefaultAsync(o => o.Id == r.OrderId && !o.IsDeleted, ct);

        if (order is null) throw new NotFoundException("Order", r.OrderId);

        if (order.Status != OrderStatus.Approved)
        {
            throw new BusinessRuleException("فقط سفارش تأییدشده قابل تبدیل به فاکتور است.");
        }

        var itemIds=order.Lines.Where(l=>l.ItemId.HasValue).Select(l=>l.ItemId).ToList();
        if(itemIds.Distinct().Count()!=itemIds.Count)
            throw new BusinessRuleException("سفارش ردیف کالای تکراری دارد؛ ابتدا ردیف‌ها و تعداد آن‌ها را اصلاح کنید.");

        // Create Invoice
        var invoice = new Invoice
        {
            BranchId = order.BranchId,
            ContactId = order.ContactId,
            OrderId = order.Id,
            Notes = order.Description,
            Type = order.Type,
            DateUtc = DateTime.UtcNow,
            Currency = CommonValidationRules.NormalizeAndValidateCurrency(order.Currency),
            InvoiceNumber = $"INV-{order.OrderNumber}",
            CreatedAtUtc = DateTime.UtcNow,
            RowVersion = []
        };

        decimal totalLineGross = 0, totalNet = 0, totalVat = 0, totalDiscount = 0, totalWithholding = 0;

        foreach (var ol in order.Lines)
        {
            var totals = InvoiceLineCalculator.Calculate(
                ol.Quantity, ol.UnitPrice, ol.VatRate, discountRate: ol.DiscountRate, withholdingRate: ol.WithholdingRate);

            invoice.Lines.Add(new InvoiceLine
            {
                ItemId = ol.ItemId,
                ItemName = ol.Item?.Name ?? ol.Description,
                ItemCode = ol.Item?.Code ?? "-",
                Unit = ol.Item?.Unit.Name ?? "-",
                Qty = ol.Quantity,
                UnitPrice = ol.UnitPrice,
                VatRate = ol.VatRate,
                DiscountRate = ol.DiscountRate, DiscountAmount = totals.DiscountAmount,
                WithholdingRate = ol.WithholdingRate, WithholdingAmount = totals.WithholdingAmount,
                Gross = totals.Gross,
                Net = totals.Net,
                Vat = totals.Vat,
                GrandTotal = totals.GrandTotal
            });

            totalLineGross += totals.Gross;
            totalDiscount += totals.DiscountAmount; totalWithholding += totals.WithholdingAmount;
            totalNet += totals.Net;
            totalVat += totals.Vat;
        }

        invoice.TotalLineGross = totalLineGross;
        invoice.TotalDiscount = totalDiscount; invoice.TotalWithholding = totalWithholding;
        invoice.TotalNet = totalNet;
        invoice.TotalVat = totalVat;
        invoice.TotalGross = totalNet + totalVat;
        invoice.Balance = invoice.TotalGross - totalWithholding; // Initially unpaid

        // Update Order Status
        order.Status = OrderStatus.Invoiced;
        order.UpdatedAtUtc = DateTime.UtcNow;

        _db.Invoices.Add(invoice);

        // Create StockMovements (all in same transaction)
        await AddStockMovementsAsync(invoice, order.BranchId, ct);

        // Single SaveChanges for entire operation
        await _db.SaveChangesAsync(ct);

        return invoice.Id;
    }

    private async Task AddStockMovementsAsync(Invoice invoice, int branchId, CancellationToken ct)
    {
        var candidateItemIds = invoice.Lines
            .Where(l => l.ItemId.HasValue)
            .Select(l => l.ItemId!.Value)
            .Distinct()
            .ToList();

        if (candidateItemIds.Count == 0) return;

        // Only Inventory-type items get stock movements (Service/Expense/FixedAsset don't
        // track stock) — the previous version of this method skipped this check entirely,
        // unlike CreateInvoiceHandler/CreateStockMovementHandler.
        var inventoryItemIds = await _db.Items
            .Where(i => candidateItemIds.Contains(i.Id) && i.Type == ItemType.Inventory)
            .Select(i => i.Id)
            .ToListAsync(ct);

        var itemLines = invoice.Lines
            .Where(l => l.ItemId.HasValue && inventoryItemIds.Contains(l.ItemId.Value))
            .ToList();

        if (itemLines.Count == 0) return;

        // Get default warehouse for this branch
        var defaultWarehouse = await _db.Warehouses
            .Where(w => w.BranchId == branchId && w.IsDefault && !w.IsDeleted)
            .FirstOrDefaultAsync(ct);

        if (defaultWarehouse == null)
        {
            defaultWarehouse = await _db.Warehouses
                .Where(w => w.BranchId == branchId && !w.IsDeleted)
                .FirstOrDefaultAsync(ct);
        }

        if (defaultWarehouse == null) return;

        StockMovementType? movementType = invoice.Type switch
        {
            InvoiceType.Sales => StockMovementType.SalesOut,
            InvoiceType.SalesReturn => StockMovementType.SalesReturn,
            InvoiceType.Purchase => StockMovementType.PurchaseIn,
            InvoiceType.PurchaseReturn => StockMovementType.PurchaseReturn,
            _ => null
        };

        if (movementType == null) return;

        // Get all item IDs to fetch stocks in one query
        var itemIds = itemLines.Select(l => l.ItemId!.Value).Distinct().ToList();
        var existingStocks = await _db.Stocks
            .Where(s => s.BranchId == branchId &&
                        s.WarehouseId == defaultWarehouse.Id &&
                        itemIds.Contains(s.ItemId) &&
                        !s.IsDeleted)
            .ToListAsync(ct);

        foreach (var line in itemLines)
        {
            var itemId = line.ItemId!.Value;

            // Create movement - Invoice navigation ile ilişkilendirme (SaveChanges sonrası FK set edilecek)
            var movement = new StockMovement
            {
                BranchId = branchId,
                WarehouseId = defaultWarehouse.Id,
                ItemId = itemId,
                Invoice = invoice, // Navigation property ile ilişkilendir (EF Core FK'yı otomatik set edecek)
                Type = movementType.Value,
                Quantity = line.Qty,
                TransactionDateUtc = invoice.DateUtc,
                Note = null,
                RowVersion = []
            };
            _db.StockMovements.Add(movement);

            // Update or create stock
            var stock = existingStocks.FirstOrDefault(s => s.ItemId == itemId);
            if (stock == null)
            {
                stock = new Stock
                {
                    BranchId = branchId,
                    WarehouseId = defaultWarehouse.Id,
                    ItemId = itemId,
                    Quantity = 0,
                    RowVersion = []
                };
                _db.Stocks.Add(stock);
                existingStocks.Add(stock); // Track for potential duplicate items in lines
            }

            stock.Quantity = StockQuantityCalculator.ApplyMovement(stock.Quantity, movementType.Value, line.Qty);
        }
    }
}
