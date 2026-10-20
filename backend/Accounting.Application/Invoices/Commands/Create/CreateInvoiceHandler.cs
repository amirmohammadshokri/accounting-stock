using Accounting.Application.Common.Validation;
using Accounting.Application.Common.Helpers;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Utils;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Accounting.Application.Common.Interfaces;

namespace Accounting.Application.Invoices.Commands.Create;

public class CreateInvoiceHandler
    : IRequestHandler<CreateInvoiceCommand, CreateInvoiceResult>
{
    private readonly IAppDbContext _db;
    private readonly IStockService _stockService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IInvoiceNumberService _invoiceNumberService;

    public CreateInvoiceHandler(
        IAppDbContext db,
        IStockService stockService,
        ICurrentUserService currentUserService,
        IInvoiceNumberService invoiceNumberService)
    {
        _db = db;
        _stockService = stockService;
        _currentUserService = currentUserService;
        _invoiceNumberService = invoiceNumberService;
    }

    public async Task<CreateInvoiceResult> Handle(CreateInvoiceCommand req, CancellationToken ct)
    {
        var branchId = _currentUserService.BranchId
            ?? throw new UnauthorizedAccessException("شعبه کاربر مشخص نیست.");

        var dateUtc = DateTime.SpecifyKind(req.DateUtc, DateTimeKind.Utc);
        var waybillDate = req.WaybillDateUtc.HasValue
            ? DateTime.SpecifyKind(req.WaybillDateUtc.Value, DateTimeKind.Utc)
            : (DateTime?)null;
        var dueDate = req.PaymentDueDateUtc.HasValue
            ? DateTime.SpecifyKind(req.PaymentDueDateUtc.Value, DateTimeKind.Utc)
            : (DateTime?)null;

        var currency = CommonValidationRules.NormalizeAndValidateCurrency(req.Currency);
        var invType = req.Type;

        var itemIds = req.Lines
            .Where(x => x.ItemId.HasValue)
            .Select(l => l.ItemId!.Value)
            .Distinct()
            .ToList();

        var itemsMap = await _db.Items
           .Where(i => itemIds.Contains(i.Id))
           .Select(i => new {
               i.Id,
               i.Code,
               i.Name,
               Unit = i.Unit.Name,
                Type = i.Type,
               i.DefaultWithholdingRate
           })
           .ToDictionaryAsync(i => i.Id, i => (dynamic)i, ct);

        var invoiceNumberPrefix = Accounting.Application.Services.InvoiceNumberService.GetPrefix(invType);
        var invoiceNumber = await _invoiceNumberService.GenerateNextAsync(branchId, invoiceNumberPrefix, ct);

        var invoice = new Invoice
        {
            BranchId = branchId,
            ContactId = req.ContactId,
            DateUtc = dateUtc,
            Currency = currency,
            Type = invType,
            DocumentType = req.DocumentType ?? Domain.Enums.DocumentType.Invoice,
            InvoiceNumber = invoiceNumber,
            Notes = req.Notes?.Trim(),
            WaybillNumber = req.WaybillNumber,
            WaybillDateUtc = waybillDate,
            PaymentDueDateUtc = dueDate,
            CurrencyRate = 1.0m
        };

        decimal totalLineGross = 0;
        decimal totalDiscount = 0;
        decimal totalNet = 0;
        decimal totalVat = 0;
        decimal totalWithholding = 0;

        foreach (var lineDto in req.Lines)
        {
            if (!lineDto.ItemId.HasValue)
                throw new FluentValidation.ValidationException("انتخاب کالا برای تمام ردیف‌های فاکتور الزامی است.");

            var itemId = lineDto.ItemId.Value;
            if (!itemsMap.ContainsKey(itemId))
                throw new NotFoundException("Item", itemId);

            var item = itemsMap[itemId];

            // Muhasebe kodunu otomatik belirle (TDHP)
            var accountCode = AccountCodeHelper.GetAccountCode(invType, (ItemType)item.Type);

            var line = new InvoiceLine
            {
                ItemId = itemId,
                ItemCode = item.Code,
                ItemName = item.Name,
                Unit = item.Unit,
                AccountCode = accountCode,  // TDHP kodu
                Qty = lineDto.Qty,
                UnitPrice = lineDto.UnitPrice,
                VatRate = lineDto.VatRate,
                WithholdingRate = lineDto.WithholdingRate ?? item.DefaultWithholdingRate ?? 0
            };

            var discountRate = lineDto.DiscountRate ?? 0;
            line.DiscountRate = discountRate;

            var totals = InvoiceLineCalculator.Calculate(
                line.Qty, line.UnitPrice, line.VatRate, discountRate, line.WithholdingRate);

            line.Gross = totals.Gross;
            line.DiscountAmount = totals.DiscountAmount;
            line.Net = totals.Net;
            line.Vat = totals.Vat;
            line.WithholdingAmount = totals.WithholdingAmount;
            line.GrandTotal = totals.GrandTotal;

            invoice.Lines.Add(line);

            totalLineGross += totals.Gross;
            totalDiscount += totals.DiscountAmount;
            totalNet += totals.Net;
            totalVat += totals.Vat;
            totalWithholding += totals.WithholdingAmount;
        }

        invoice.TotalLineGross = totalLineGross;
        invoice.TotalDiscount = totalDiscount;
        invoice.TotalNet = totalNet;
        invoice.TotalVat = totalVat;
        invoice.TotalWithholding = totalWithholding;
        invoice.TotalGross = totalNet + totalVat;
        invoice.Balance = invoice.TotalGross - totalWithholding;

        await using var tx = await _db.BeginTransactionAsync(ct);
        try
        {
            _db.Invoices.Add(invoice);
            await _db.SaveChangesAsync(ct);

            // Stok hareketi oluşturma
            await CreateStockMovementsAsync(invoice, itemsMap, ct);

            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }

        return new CreateInvoiceResult(
            invoice.Id,
            invoice.TotalNet,
            invoice.TotalVat,
            invoice.TotalGross,
            "AwayFromZero"
        );
    }

    private async Task CreateStockMovementsAsync(
        Invoice invoice,
        Dictionary<int, dynamic> itemsMap,
        CancellationToken ct)
    {
        // Hareket tipi belirle
        StockMovementType? movementType = invoice.Type switch
        {
            InvoiceType.Sales => StockMovementType.SalesOut,
            InvoiceType.SalesReturn => StockMovementType.SalesReturn,
            InvoiceType.Purchase => StockMovementType.PurchaseIn,
            InvoiceType.PurchaseReturn => StockMovementType.PurchaseReturn,
            _ => null
        };

        if (movementType == null) return;

        // Stok hareketi gerektiren (Inventory tipinde, miktarı sıfırdan farklı) satırlar.
        // Bu kontrol depo aramasından ÖNCE yapılır: sadece Hizmet/Masraf/Demirbaş kalemi
        // içeren bir faturada, o şubede hiç depo tanımlı olmasa bile hata verilmemeli.
        var eligibleLines = invoice.Lines
            .Where(l => l.ItemId != null
                && l.Qty != 0
                && itemsMap.TryGetValue(l.ItemId.Value, out var item)
                && (ItemType)item.Type == ItemType.Inventory)
            .ToList();

        if (eligibleLines.Count == 0) return;

        // Varsayılan depoyu bul
        var defaultWarehouse = await _db.Warehouses
            .Where(w => w.BranchId == invoice.BranchId && w.IsDefault && !w.IsDeleted)
            .Select(w => new { w.Id, w.Name })
            .FirstOrDefaultAsync(ct);

        if (defaultWarehouse == null)
        {
            defaultWarehouse = await _db.Warehouses
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

        // Tüm satırların stok anlık görüntülerini tek sorguda çek (satır başına
        // ayrı mediator dispatch + ayrı SaveChangesAsync yerine).
        var itemIds = eligibleLines.Select(l => l.ItemId!.Value).Distinct().ToList();
        var stocksByItemId = await _db.Stocks
            .Where(s => s.BranchId == invoice.BranchId
                && s.WarehouseId == defaultWarehouse.Id
                && itemIds.Contains(s.ItemId))
            .ToDictionaryAsync(s => s.ItemId, ct);

        foreach (var line in eligibleLines)
        {
            var itemId = line.ItemId!.Value;
            var qty = DecimalExtensions.RoundQuantity(line.Qty);

            if (!stocksByItemId.TryGetValue(itemId, out var stock))
            {
                stock = new Stock
                {
                    BranchId = invoice.BranchId,
                    WarehouseId = defaultWarehouse.Id,
                    ItemId = itemId,
                    Quantity = 0m
                };
                _db.Stocks.Add(stock);
                stocksByItemId[itemId] = stock;
            }

            stock.Quantity = StockQuantityCalculator.ApplyMovement(stock.Quantity, movementType.Value, qty);

            _db.StockMovements.Add(new StockMovement
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

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("موجودی هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.");
        }
    }
}
