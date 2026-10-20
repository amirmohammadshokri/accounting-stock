using Accounting.Application.Common.Abstractions;
using ClosedXML.Excel;
using System.Globalization;
using System.Reflection;

namespace Accounting.Application.Common.Services;

public class ExcelService : IExcelService
{
    private static readonly Dictionary<string, string> Labels = new()
    {
        ["StockStatus"] = "موجودی انبار", ["Statement"] = "صورت‌حساب", ["Invoices"] = "فاکتورها", ["Orders"] = "سفارش‌ها", ["Stocks"] = "موجودی",
        ["RowVersion"] = "نسخه رکورد", ["RowVersionBase64"] = "نسخه رکورد", ["Id"] = "شناسه", ["BranchId"] = "شناسه شعبه", ["BranchCode"] = "کد شعبه", ["BranchName"] = "نام شعبه",
        ["ContactId"] = "شناسه طرف حساب", ["ContactCode"] = "کد طرف حساب", ["ContactName"] = "نام طرف حساب",
        ["ItemId"] = "شناسه کالا", ["ItemCode"] = "کد کالا", ["ItemName"] = "نام کالا", ["WarehouseId"] = "شناسه انبار", ["WarehouseCode"] = "کد انبار", ["WarehouseName"] = "نام انبار",
        ["Type"] = "نوع", ["Status"] = "وضعیت", ["DateUtc"] = "تاریخ", ["CreatedAtUtc"] = "زمان ایجاد", ["UpdatedAtUtc"] = "آخرین تغییر",
        ["InvoiceNumber"] = "شماره فاکتور", ["OrderNumber"] = "شماره سفارش", ["DocumentNo"] = "شماره سند", ["Currency"] = "واحد پول", ["Description"] = "شرح", ["Note"] = "یادداشت",
        ["Unit"] = "واحد", ["Qty"] = "مقدار", ["Quantity"] = "مقدار", ["QuantityIn"] = "ورودی", ["QuantityOut"] = "خروجی", ["QuantityReserved"] = "رزرو شده", ["QuantityAvailable"] = "موجودی قابل استفاده",
        ["UnitPrice"] = "قیمت واحد", ["VatRate"] = "نرخ مالیات", ["DiscountRate"] = "نرخ تخفیف", ["DiscountAmount"] = "مبلغ تخفیف", ["WithholdingRate"] = "نرخ مالیات تکلیفی", ["WithholdingAmount"] = "مالیات تکلیفی",
        ["Net"] = "خالص", ["Vat"] = "مالیات بر ارزش افزوده", ["Gross"] = "ناخالص", ["GrandTotal"] = "مبلغ نهایی", ["TotalNet"] = "جمع خالص", ["TotalVat"] = "جمع مالیات", ["TotalGross"] = "مبلغ نهایی",
        ["Debt"] = "بدهکار", ["Credit"] = "بستانکار", ["Balance"] = "مانده", ["Amount"] = "مبلغ", ["IsActive"] = "فعال", ["IsDeleted"] = "حذف شده", ["DocumentType"] = "نوع سند"
    };
    private static readonly Dictionary<string, string> Values = new()
    {
        ["IRR"] = "ریال ایران",
        ["Sales"] = "فروش", ["Purchase"] = "خرید", ["SalesReturn"] = "برگشت از فروش", ["PurchaseReturn"] = "برگشت از خرید",
        ["Draft"] = "پیش‌نویس", ["Approved"] = "تأیید شده", ["Invoiced"] = "فاکتور شده", ["Cancelled"] = "لغو شده",
        ["Cash"] = "صندوق", ["Bank"] = "بانک", ["DEVİR"] = "مانده ابتدای دوره", ["Satış Faturası"] = "فاکتور فروش", ["Alış Faturası"] = "فاکتور خرید", ["Satış İadesi"] = "برگشت از فروش", ["Alış İadesi"] = "برگشت از خرید", ["Fatura"] = "فاکتور", ["Tahsilat"] = "دریافت", ["Ödeme"] = "پرداخت",
        ["Önceki dönem bakiyesi"] = "مانده دوره قبل"
    };
    private static string Digits(string value) => string.Concat(value.Select(c => c is >= '0' and <= '9' ? (char)('۰' + c - '0') : c));
    private static string DateText(DateTime date)
    {
        var calendar = new PersianCalendar();
        return Digits($"{calendar.GetYear(date):0000}/{calendar.GetMonth(date):00}/{calendar.GetDayOfMonth(date):00} {date:HH:mm}");
    }

    public async Task<byte[]> ExportAsync<T>(IEnumerable<T> data, string sheetName)
    {
        return await Task.Run(() =>
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add(Labels.GetValueOrDefault(sheetName, sheetName));
            worksheet.RightToLeft = true;
            worksheet.Style.Font.FontName = "Tahoma";
            worksheet.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            for (int i = 0; i < properties.Length; i++)
                worksheet.Cell(1, i + 1).Value = Labels.GetValueOrDefault(properties[i].Name, properties[i].Name);

            var list = data.ToList();
            if (list.Count > 0) worksheet.Cell(2, 1).InsertData(list);
            for (int row = 0; row < list.Count; row++)
            {
                for (int col = 0; col < properties.Length; col++)
                {
                    var property = properties[col];
                    var value = property.GetValue(list[row]);
                    var cell = worksheet.Cell(row + 2, col + 1);
                    if (property.Name == "Type" && value is int invoiceType && typeof(T).Name.Contains("Invoice")) cell.Value = invoiceType switch { 1 => "فروش", 2 => "خرید", 3 => "برگشت از فروش", 4 => "برگشت از خرید", _ => Digits(invoiceType.ToString()) };
                    else if (property.Name == "DocumentType" && value is int documentType) cell.Value = documentType switch { 1 => "فاکتور", 2 => "رسید خرده‌فروشی", 3 => "سند هزینه", _ => Digits(documentType.ToString()) };
                    else if (value is DateTime date) cell.Value = DateText(date);
                    else if (value is DateTimeOffset offset) cell.Value = DateText(offset.DateTime);
                    else if (value is bool flag) cell.Value = flag ? "بله" : "خیر";
                    else if (value is Enum enumeration) cell.Value = Values.GetValueOrDefault(enumeration.ToString(), enumeration.ToString());
                    else if (value is string text && (property.Name is "Currency" or "Type" or "Status" || text == "Önceki dönem bakiyesi")) cell.Value = Values.GetValueOrDefault(text, text);
                    // Keep amounts as numbers so formulas and sorting still work in Excel.
                    else if (value is decimal or double or float) cell.Style.NumberFormat.Format = property.Name.Contains("Quantity") || property.Name == "Qty" ? "[$-fa-IR]#,##0.000" : "[$-fa-IR]#,##0.00";
                    else if (value is int or long or short) cell.Style.NumberFormat.Format = "[$-fa-IR]#,##0";
                }
            }
            var headerRange = worksheet.Range(1, 1, 1, properties.Length);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
            worksheet.SheetView.FreezeRows(1);
            worksheet.Columns().AdjustToContents();
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        });
    }
}
