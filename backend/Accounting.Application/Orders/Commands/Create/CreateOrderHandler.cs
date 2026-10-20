using Accounting.Application.Services;
using Accounting.Application.Common.Validation;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Utils;
using Accounting.Application.Orders.Dto;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Orders.Commands.Create;

public class CreateOrderHandler(IAppDbContext db, ICurrentUserService currentUserService) : IRequestHandler<CreateOrderCommand, OrderDetailDto>
{
    public async Task<OrderDetailDto> Handle(CreateOrderCommand r, CancellationToken ct)
    {
        var branchId = currentUserService.BranchId ?? throw new UnauthorizedAccessException();

        // 1. Generate Order Number.
        // Prefixed + StartsWith-filtered, same technique as InvoiceNumberService, and the
        // same prefix family DataSeeder already uses ("SO-2026-0001", "PO-2026-0001").
        // The previous version generated a bare "000001" and picked "the last order" by
        // ordering the whole (branch, type) set by OrderNumber string descending — which,
        // as soon as any seeded "SO-..."/"PO-..." row existed for that branch/type (it
        // always does), sorted ahead of "000001" lexicographically, failed to parse as a
        // number, and silently reset nextNum back to 1 on every single order creation. In
        // practice this meant the second real order for a given branch+type always hit a
        // duplicate-key constraint violation (500) on the OrderNumber unique index.
        var orderNumberPrefix = r.Type switch
        {
            InvoiceType.Sales => "SO",
            InvoiceType.Purchase => "PO",
            InvoiceType.SalesReturn => "SR",
            InvoiceType.PurchaseReturn => "PR",
            _ => "OR"
        };
        var prefix = $"{orderNumberPrefix}-{DateTime.UtcNow.Year}-";

        var lastOrderNumber = await db.Orders
            .Where(o => o.BranchId == branchId && o.Type == r.Type && o.OrderNumber.StartsWith(prefix))
            .OrderByDescending(o => o.OrderNumber)
            .Select(o => o.OrderNumber)
            .FirstOrDefaultAsync(ct);

        var nextSeq = 1;
        if (lastOrderNumber != null && int.TryParse(lastOrderNumber[prefix.Length..], out var lastSeq))
        {
            nextSeq = lastSeq + 1;
        }
        var orderNumber = $"{prefix}{nextSeq:0000}";

        // 2. Create Order
        var order = new Order
        {
            BranchId = branchId,
            ContactId = r.ContactId,
            OrderNumber = orderNumber,
            DateUtc = r.DateUtc,
            Type = r.Type,
            Status = OrderStatus.Draft,
            Currency = CommonValidationRules.NormalizeAndValidateCurrency(r.Currency),
            Description = r.Description,
            CreatedAtUtc = DateTime.UtcNow,
            RowVersion = []
        };

        decimal totalNet = 0;
        decimal totalVat = 0;

        foreach (var l in r.Lines)
        {
            var amounts = InvoiceLineCalculator.Calculate(l.Quantity, l.UnitPrice, l.VatRate, l.DiscountRate, l.WithholdingRate);
            var lineNet = amounts.Net;
            var vatAmount = amounts.Vat;

            totalNet += lineNet;
            totalVat += vatAmount;

            order.Lines.Add(new OrderLine
            {
                ItemId = l.ItemId,
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                VatRate = l.VatRate,
                DiscountRate = l.DiscountRate, WithholdingRate = l.WithholdingRate,
                Total = lineNet // Storing Net Total line-by-line
            });
        }

        order.TotalNet = totalNet;
        order.TotalVat = totalVat;
        order.TotalGross = totalNet + totalVat;

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        // Return DTO
        return new OrderDetailDto(
            order.Id,
            order.BranchId,
            order.OrderNumber,
            order.ContactId,
            "", // Contact name - could be fetched if needed
            order.DateUtc,
            order.Type,
            order.Status,
            order.TotalNet,
            order.TotalVat,
            order.TotalGross,
            order.Currency,
            order.Description,
            order.Lines.Select(x => new OrderLineDto(x.Id, x.ItemId, null, x.Description, x.Quantity, x.UnitPrice, x.VatRate, x.Total, x.DiscountRate, x.WithholdingRate)).ToList(),
            Convert.ToBase64String(order.RowVersion),
            order.CreatedAtUtc,
            order.UpdatedAtUtc
        );
    }
}
