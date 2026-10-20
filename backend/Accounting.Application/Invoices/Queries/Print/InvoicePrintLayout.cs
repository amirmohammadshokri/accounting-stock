using System.ComponentModel.DataAnnotations;
namespace Accounting.Application.Invoices.Queries.Print;

public record InvoicePrintLayout {
    public static readonly string[] Formats = ["a4-landscape", "a4-portrait", "a5-portrait"];
    [Required, RegularExpression("^(a4-landscape|a4-portrait|a5-portrait)$")] public string Format { get; init; } = "a4-portrait";
    [StringLength(100)] public string Title { get; init; } = "";
    [Range(7, 12)] public int FontSize { get; init; } = 9;
    [Range(0.5, 1.5)] public double Margin { get; init; } = 0.7;
    [Required, RegularExpression("^#[0-9a-fA-F]{6}$")] public string HeaderColor { get; init; } = "#e8eef7";
    public bool ShowCode { get; init; } = false;
    public bool ShowDiscount { get; init; } = true;
    public bool ShowSignatures { get; init; } = true;
    public bool ShowTax { get; init; } = false;
    public bool ShowUnit { get; init; } = true;
    public bool ShowLogo { get; init; } = true;
    public bool ShowSeller { get; init; } = true;
    public bool ShowBuyer { get; init; } = true;
    public bool ShowContactDetails { get; init; } = true;
    public bool ShowWords { get; init; } = false;
    public bool ShowBalance { get; init; } = true;
    public bool ShowNotes { get; init; } = true;
    [Range(10, 30)] public int MinimumRows { get; init; } = 10;
    [Range(0.4, 1.2)] public double RowHeight { get; init; } = 0.55;
    [Required, RegularExpression("^(right|left|center)$")] public string LogoPosition { get; init; } = "right";
    [StringLength(300)] public string HeaderText { get; init; } = "";
    [StringLength(2000)] public string Terms { get; init; } = "";
    [StringLength(300)] public string FooterText { get; init; } = "با سپاس از انتخاب شما";
    [Required, RegularExpression("^(summary-first|terms-first)$")] public string FooterOrder { get; init; } = "summary-first";
    [Required, RegularExpression("^(Row|Code|Description|Quantity|Unit|UnitPrice|Discount|Vat|Total)(,(Row|Code|Description|Quantity|Unit|UnitPrice|Discount|Vat|Total))*$")]
    [StringLength(100)]
    public string ColumnOrder { get; init; } = "Row,Code,Description,Quantity,Unit,UnitPrice,Discount,Vat,Total";

}
public record InvoicePrintLayoutVersion(InvoicePrintLayout Layout, string Version);
public record SaveInvoicePrintLayout(InvoicePrintLayout Layout, [Required] string Version);
public interface IInvoicePrintLayoutStore {
    InvoicePrintLayoutVersion Get(string format);
    InvoicePrintLayoutVersion Save(InvoicePrintLayout layout, string version);
}
