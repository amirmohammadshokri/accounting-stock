using Accounting.Application.Common.Services;
using ClosedXML.Excel;

namespace Accounting.Tests;

public class PersianExcelTests
{
    private record ReportRow(DateTime DateUtc, string Currency, decimal Amount, string Type, string Description);

    [Fact]
    public async Task Export_LocalizesPresentation_AndPreservesNumericAmounts()
    {
        var bytes = await new ExcelService().ExportAsync(new[] { new ReportRow(new DateTime(2026, 10, 14, 13, 45, 0), "IRR", 12345.67m, "Tahsilat", "نام مشتری") }, "Statement");
        using var workbook = new XLWorkbook(new MemoryStream(bytes));
        var sheet = workbook.Worksheet("صورت‌حساب");
        Assert.True(sheet.RightToLeft);
        Assert.Equal("تاریخ", sheet.Cell(1, 1).GetString());
        Assert.Equal("۱۴۰۵/۰۷/۲۲ ۱۳:۴۵", sheet.Cell(2, 1).GetString());
        Assert.Equal("ریال ایران", sheet.Cell(2, 2).GetString());
        Assert.Equal(XLDataType.Number, sheet.Cell(2, 3).DataType);
        Assert.Equal(12345.67m, sheet.Cell(2, 3).GetValue<decimal>());
        Assert.Equal("دریافت", sheet.Cell(2, 4).GetString());
        Assert.Equal("نام مشتری", sheet.Cell(2, 5).GetString());
    }
}
