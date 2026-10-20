using Accounting.Application.Common.Validation;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Utils;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Invoices.Queries.Dto;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Accounting.Application.Common.Interfaces;

public sealed class UpdateInvoiceHandler : IRequestHandler<UpdateInvoiceCommand, InvoiceDetailDto>
{
    private readonly IAppDbContext _ctx;
    private readonly IInvoiceBalanceService _balanceService;
    private readonly ICurrentUserService _currentUserService;

    public UpdateInvoiceHandler(
        IAppDbContext ctx,
        IInvoiceBalanceService balanceService,
        ICurrentUserService currentUserService)
    {
        _ctx = ctx;
        _balanceService = balanceService;
        _currentUserService = currentUserService;
    }

    public async Task<InvoiceDetailDto> Handle(UpdateInvoiceCommand r, CancellationToken ct)
    {
        // 1) Aggregate (+Include)
        var inv = await _ctx.Invoices
            .ApplyBranchFilter(_currentUserService)
            .Include(i => i.Lines)
            .FirstOrDefaultAsync(i => i.Id == r.Id, ct)
            ?? throw new NotFoundException(nameof(Invoice), r.Id);

        // 2) Concurrency (RowVersion base64)
        _ctx.Entry(inv).Property(nameof(Invoice.RowVersion))
            .OriginalValue = Convert.FromBase64String(r.RowVersionBase64);

        // 3) Normalize (parent)
        inv.Currency = CommonValidationRules.PreserveExistingCurrency(r.Currency, inv.Currency);
        inv.DateUtc = DateTime.SpecifyKind(r.DateUtc, DateTimeKind.Utc);
        inv.ContactId = r.ContactId;
        inv.Type = r.Type;
        inv.DocumentType = r.DocumentType ?? inv.DocumentType;  // 🆕 EKLENDI

        // 4) Header Fields
        var now = DateTime.UtcNow;
        inv.Notes = r.Notes?.Trim();
        inv.WaybillNumber = r.WaybillNumber;
        inv.WaybillDateUtc = r.WaybillDateUtc.HasValue
            ? DateTime.SpecifyKind(r.WaybillDateUtc.Value, DateTimeKind.Utc)
            : null;
        inv.PaymentDueDateUtc = r.PaymentDueDateUtc.HasValue
            ? DateTime.SpecifyKind(r.PaymentDueDateUtc.Value, DateTimeKind.Utc)
            : null;

        // Reset Totals
        inv.TotalLineGross = 0;
        inv.TotalDiscount = 0;
        inv.TotalNet = 0;
        inv.TotalVat = 0;
        inv.TotalWithholding = 0;
        inv.TotalGross = 0;

        // ❌ KALDIRILDI: ExpenseDefinition fetch logic
        // Sadece Item'ları çek
        var allItemIds = r.Lines
            .Where(x => x.ItemId.HasValue)
            .Select(x => x.ItemId!.Value)
            .Distinct()
            .ToList();

        var itemsMap = await _ctx.Items
            .Where(i => allItemIds.Contains(i.Id))
            .Select(i => new {
                i.Id,
                i.Code,
                i.Name,
                Unit = i.Unit.Name,
                i.VatRate,
                type = i.Type,
                i.DefaultWithholdingRate
            })
            .ToDictionaryAsync(i => i.Id, i => (dynamic)i, ct);

        var incomingById = r.Lines.Where(x => x.Id > 0).ToDictionary(x => x.Id);

        // a) Silinecekler
        foreach (var line in inv.Lines.ToList())
        {
            if (!incomingById.ContainsKey(line.Id))
            {
                line.IsDeleted = true;
                line.DeletedAtUtc = now;
            }
        }

        // b) Güncellenecekler & Yeni Eklenecekler
        foreach (var line in inv.Lines.Where(l => !l.IsDeleted))
        {
            if (incomingById.TryGetValue(line.Id, out var dto))
            {
                ProcessLine(inv, line, dto, itemsMap, now);
            }
        }

        // Yeni ekle
        foreach (var dto in r.Lines.Where(x => x.Id == 0))
        {
            var nl = new InvoiceLine { CreatedAtUtc = now };
            inv.Lines.Add(nl);
            ProcessLine(inv, nl, dto, itemsMap, now);
        }

        // UpdatedAt
        inv.UpdatedAtUtc = now;

        // RE-SUM from active lines
        var activeLines = inv.Lines.Where(l => !l.IsDeleted).ToList();
        inv.TotalLineGross = DecimalExtensions.RoundAmount(activeLines.Sum(x => x.Gross));
        inv.TotalDiscount = DecimalExtensions.RoundAmount(activeLines.Sum(x => x.DiscountAmount));
        inv.TotalNet = DecimalExtensions.RoundAmount(activeLines.Sum(x => x.Net));
        inv.TotalVat = DecimalExtensions.RoundAmount(activeLines.Sum(x => x.Vat));
        inv.TotalWithholding = DecimalExtensions.RoundAmount(activeLines.Sum(x => x.WithholdingAmount));
        inv.TotalGross = DecimalExtensions.RoundAmount(inv.TotalNet + inv.TotalVat);

        // Balance Update
        inv.Balance = inv.TotalGross - inv.TotalWithholding;
        await _balanceService.RecalculateBalanceAsync(inv.Id, ct);

        // Transaction
        await using var tx = await _ctx.BeginTransactionAsync(ct);
        try
        {
            try { await _ctx.SaveChangesAsync(ct); }
            catch (DbUpdateConcurrencyException)
            { throw new ConcurrencyConflictException(); }

            // Stok hareketlerini senkronize et
            await SyncStockMovements(inv, itemsMap, ct);

            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }

        // Fresh read
        var fresh = await _ctx.Invoices
            .AsNoTracking()
            .Include(i => i.Branch)
            .Include(i => i.Contact)
            .Include(i => i.Lines)
            .FirstAsync(i => i.Id == inv.Id, ct);

        // Lines → DTO (❌ ExpenseDefinitionId kaldırıldı)
        var linesDto = fresh.Lines
            .OrderBy(l => l.Id)
            .Select(l => new InvoiceLineDto(
                l.Id,
                l.ItemId,
                // ❌ l.ExpenseDefinitionId,  KALDIRILDI
                l.ItemCode,
                l.ItemName,
                l.Unit,
                l.AccountCode,
                l.Qty,
                l.UnitPrice,
                l.VatRate,
                l.DiscountRate,
                l.DiscountAmount,
                l.Net,
                l.Vat,
                l.WithholdingRate,
                l.WithholdingAmount,
                l.Gross,
                l.GrandTotal
            ))
            .ToList();

        // DTO build (🆕 DocumentType eklendi)
        return new InvoiceDetailDto(
            fresh.Id,
            fresh.ContactId,
            fresh.Contact?.Code ?? "",
            fresh.Contact?.Name ?? "",
            fresh.DateUtc,
            fresh.InvoiceNumber,
            fresh.Currency,
            fresh.TotalLineGross,
            fresh.TotalDiscount,
            fresh.TotalNet,
            fresh.TotalVat,
            fresh.TotalWithholding,
            fresh.TotalGross,
            fresh.Balance,
            linesDto,
            (int)fresh.Type,
            (int)fresh.DocumentType,  // 🆕 EKLENDI
            fresh.BranchId,
            fresh.Branch.Code,
            fresh.Branch.Name,
            fresh.WaybillNumber,
            fresh.WaybillDateUtc,
            fresh.PaymentDueDateUtc,
            Convert.ToBase64String(fresh.RowVersion),
            fresh.CreatedAtUtc,
            fresh.UpdatedAtUtc
        ) { Notes = fresh.Notes };
    }

    private void ProcessLine(
        Invoice inv,
        InvoiceLine line,
        UpdateInvoiceLineDto dto,
        Dictionary<int, dynamic> itemsMap,
        DateTime now)
    {
        // ❌ KALDIRILDI: InvoiceType.Expense kontrolü
        // Artık sadece ItemId var

        if (!dto.ItemId.HasValue)
            throw new FluentValidation.ValidationException("انتخاب کالا برای تمام ردیف‌های فاکتور الزامی است.");

        line.ItemId = dto.ItemId.Value;

        if (!itemsMap.TryGetValue(line.ItemId.Value, out var item))
            throw new NotFoundException("Item", line.ItemId.Value);

        // Snapshot bilgileri
        line.ItemCode = item.Code;
        line.ItemName = item.Name;
        line.Unit = item.Unit;

        decimal discountRate = dto.DiscountRate ?? 0;
        int withholdingRate = dto.WithholdingRate ?? item.DefaultWithholdingRate ?? 0;

        var totals = InvoiceLineCalculator.Calculate(
            dto.Qty, dto.UnitPrice, dto.VatRate, discountRate, withholdingRate);

        // Assign to Line
        line.Qty = dto.Qty;
        line.UnitPrice = dto.UnitPrice;
        line.VatRate = dto.VatRate;
        line.DiscountRate = discountRate;
        line.DiscountAmount = totals.DiscountAmount;
        line.Gross = totals.Gross;
        line.Net = totals.Net;
        line.Vat = totals.Vat;
        line.WithholdingRate = withholdingRate;
        line.WithholdingAmount = totals.WithholdingAmount;
        line.GrandTotal = totals.GrandTotal;
        line.UpdatedAtUtc = now;
    }

    private async Task SyncStockMovements(
        Invoice invoice,
        Dictionary<int, dynamic> itemsMap,
        CancellationToken ct)
    {
        // Mevcut hareketleri bul. Önce stoktaki eski etkilerini geri alıyoruz, sonra
        // soft-delete ediyoruz — eskiden sadece soft-delete ediliyordu ve Stock.Quantity
        // hiç geri alınmıyordu, bu yüzden bir faturanın miktarı değiştirildiğinde eski
        // düşüm/artışın üstüne yenisi binip stoğu bozuyordu (örn. 5 adet düşülmüşken 3'e
        // güncellenince toplam 8 adet düşüyordu, net 3 değil).
        //
        // Ayrıca artık CreateStockMovementCommand'ı mediator ile göndermiyoruz: o handler
        // depoyu ÇAĞIRANIN kendi şubesine göre arıyordu (invoice.BranchId'ye göre değil),
        // bu da bir admin/HQ kullanıcısı başka bir şubenin faturasını güncellediğinde
        // "Warehouse bulunamadı" hatasına yol açıyordu. CreateInvoiceHandler ve
        // CreateInvoiceFromOrderHandler'daki gibi doğrudan invoice.BranchId'ye göre,
        // StockQuantityCalculator ile, tek sorguda/tek save'de uyguluyoruz.
        var existingMovements = await _ctx.StockMovements
            .Where(m => m.InvoiceId == invoice.Id && !m.IsDeleted)
            .ToListAsync(ct);

        var stocksByKey = new Dictionary<(int WarehouseId, int ItemId), Stock>();

        if (existingMovements.Count > 0)
        {
            var warehouseIds = existingMovements.Select(m => m.WarehouseId).Distinct().ToList();
            var reverseItemIds = existingMovements.Select(m => m.ItemId).Distinct().ToList();

            var reverseStocks = await _ctx.Stocks
                .Where(s => s.BranchId == invoice.BranchId
                    && warehouseIds.Contains(s.WarehouseId)
                    && reverseItemIds.Contains(s.ItemId))
                .ToListAsync(ct);

            foreach (var s in reverseStocks) stocksByKey[(s.WarehouseId, s.ItemId)] = s;

            foreach (var move in existingMovements)
            {
                if (stocksByKey.TryGetValue((move.WarehouseId, move.ItemId), out var stock))
                {
                    var reverseSignedQty = StockQuantityCalculator.IsIncoming(move.Type) ? -move.Quantity : move.Quantity;
                    stock.Quantity = DecimalExtensions.RoundQuantity(stock.Quantity + reverseSignedQty);
                }

                move.IsDeleted = true;
                move.DeletedAtUtc = DateTime.UtcNow;
            }
        }

        // Hareket tipi belirle
        StockMovementType? movementType = invoice.Type switch
        {
            InvoiceType.Sales => StockMovementType.SalesOut,
            InvoiceType.SalesReturn => StockMovementType.SalesReturn,
            InvoiceType.Purchase => StockMovementType.PurchaseIn,
            InvoiceType.PurchaseReturn => StockMovementType.PurchaseReturn,
            _ => null
        };

        if (movementType != null)
        {
            // Stok hareketi gerektiren (Inventory tipinde) satırlar — depo aramasından
            // ÖNCE hesaplanır: sadece Hizmet/Masraf/Demirbaş kalemi içeren bir faturada,
            // o şubede hiç depo tanımlı olmasa bile hata verilmemeli.
            var eligibleLines = invoice.Lines
                .Where(l => l.ItemId != null && !l.IsDeleted && l.Qty != 0
                    && itemsMap.TryGetValue(l.ItemId.Value, out var it)
                    && (ItemType)it.type == ItemType.Inventory)
                .ToList();

            if (eligibleLines.Count > 0)
            {
                var defaultWarehouse = await _ctx.Warehouses
                    .Where(w => w.BranchId == invoice.BranchId && w.IsDefault && !w.IsDeleted)
                    .Select(w => new { w.Id, w.Name })
                    .FirstOrDefaultAsync(ct);

                if (defaultWarehouse == null)
                {
                    defaultWarehouse = await _ctx.Warehouses
                        .Where(w => w.BranchId == invoice.BranchId && !w.IsDeleted)
                        .OrderBy(w => w.Id)
                        .Select(w => new { w.Id, w.Name })
                        .FirstOrDefaultAsync(ct);
                }

                if (defaultWarehouse == null)
                {
                    throw new BusinessRuleException(
                        $"برای شعبه با شناسه {invoice.BranchId} انباری تعریف نشده است.");
                }

                var neededItemIds = eligibleLines.Select(l => l.ItemId!.Value).Distinct().ToList();
                var missingItemIds = neededItemIds
                    .Where(id => !stocksByKey.ContainsKey((defaultWarehouse.Id, id)))
                    .ToList();

                if (missingItemIds.Count > 0)
                {
                    var moreStocks = await _ctx.Stocks
                        .Where(s => s.BranchId == invoice.BranchId
                            && s.WarehouseId == defaultWarehouse.Id
                            && missingItemIds.Contains(s.ItemId))
                        .ToListAsync(ct);

                    foreach (var s in moreStocks) stocksByKey[(s.WarehouseId, s.ItemId)] = s;
                }

                foreach (var line in eligibleLines)
                {
                    var itemId = line.ItemId!.Value;
                    var qty = DecimalExtensions.RoundQuantity(line.Qty);
                    var key = (defaultWarehouse.Id, itemId);

                    if (!stocksByKey.TryGetValue(key, out var stock))
                    {
                        stock = new Stock
                        {
                            BranchId = invoice.BranchId,
                            WarehouseId = defaultWarehouse.Id,
                            ItemId = itemId,
                            Quantity = 0m
                        };
                        _ctx.Stocks.Add(stock);
                        stocksByKey[key] = stock;
                    }

                    stock.Quantity = StockQuantityCalculator.ApplyMovement(stock.Quantity, movementType.Value, qty);

                    _ctx.StockMovements.Add(new StockMovement
                    {
                        BranchId = invoice.BranchId,
                        WarehouseId = defaultWarehouse.Id,
                        ItemId = itemId,
                        InvoiceId = invoice.Id,
                        Type = movementType.Value,
                        Quantity = qty,
                        TransactionDateUtc = invoice.DateUtc,
                        Note = null
                    });
                }
            }
        }

        try
        {
            await _ctx.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("موجودی هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.");
        }
    }
}
