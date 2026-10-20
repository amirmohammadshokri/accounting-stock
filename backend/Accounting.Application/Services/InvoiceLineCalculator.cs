using Accounting.Application.Common.Utils;

namespace Accounting.Application.Services;

/// <summary>
/// Single source of truth for invoice line totals (Matrah/KDV/Tevkifat).
/// Used by both CreateInvoiceHandler and UpdateInvoiceHandler so the two
/// can never drift into computing a line's Net/Vat/Gross differently.
/// </summary>
public static class InvoiceLineCalculator
{
    public readonly record struct LineTotals(
        decimal Gross,
        decimal DiscountAmount,
        decimal Net,
        decimal Vat,
        decimal WithholdingAmount,
        decimal GrandTotal);

    public static LineTotals Calculate(
        decimal qty,
        decimal unitPrice,
        int vatRate,
        decimal discountRate,
        int withholdingRate)
    {
        var gross = DecimalExtensions.RoundAmount(qty * unitPrice);
        var discountAmount = DecimalExtensions.RoundAmount(gross * discountRate / 100m);
        var net = gross - discountAmount;
        var vat = DecimalExtensions.RoundAmount(net * vatRate / 100m);
        var withholdingAmount = DecimalExtensions.RoundAmount(vat * withholdingRate / 100m);
        var grandTotal = net + vat;

        return new LineTotals(gross, discountAmount, net, vat, withholdingAmount, grandTotal);
    }
}
