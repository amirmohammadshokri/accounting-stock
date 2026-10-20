namespace Accounting.Application.Invoices.Queries.Print;

public record InvoicePrintParty(string Name, string? EconomicNumber, string? NationalId,
    string? PostalCode, string? Address, string? Phone) { public string? CustomerNumber { get; init; } }

public record InvoicePrintLine(int Row, string Code, string Description, string Unit,
    decimal Quantity, decimal UnitPrice, decimal Gross, decimal Discount, decimal Net,
    int VatRate, decimal Vat, decimal Total);

public record InvoicePrintDocument(int Id, string Number, DateTime DateUtc, string Title,
    InvoicePrintParty Seller, InvoicePrintParty Buyer, IReadOnlyList<InvoicePrintLine> Lines,
    decimal Gross, decimal Discount, decimal Net, decimal Vat, decimal Total,
    decimal Withholding, decimal Balance, DateTime? DueDateUtc, string? WaybillNumber) {
    public string? Notes { get; init; }
    public string? BranchName { get; init; }
    public string? LogoDataUrl { get; init; }
    public InvoicePrintLayout? Layout { get; init; }
    public string? MrtTemplate { get; init; }
    public bool IsLayoutPreview { get; init; }
}

public record InvoicePdf(byte[] Content, string FileName);

public interface IInvoicePdfService
{
    InvoicePdf Render(InvoicePrintDocument document);
}
