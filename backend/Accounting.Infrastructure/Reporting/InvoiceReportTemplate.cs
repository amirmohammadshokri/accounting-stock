using Stimulsoft.Base.Drawing;
using Stimulsoft.Report;
using Stimulsoft.Report.Components;
using System.Drawing;
using System.Data;

namespace Accounting.Infrastructure.Reporting;

public static class InvoiceReportTemplate
{
    public static StiReport Create(DataSet schema)
    {
        Stimulsoft.Base.StiFontCollection.AddFontFile(Path.Combine(AppContext.BaseDirectory, "Reporting", "Fonts", "Vazirmatn-Regular.ttf"));
        var report = new StiReport { ReportUnit = StiReportUnitType.Centimeters, ReportName = "OfficialInvoice", ReportAlias = "صورتحساب کالا و خدمات", CalculationMode = StiCalculationMode.Interpretation };
        report.RegData(schema);
        report.Dictionary.Synchronize();
        var page = report.Pages[0];
        page.Orientation = StiPageOrientation.Landscape;
        page.PageWidth = 29.7; page.PageHeight = 21;
        page.Margins = new StiMargins(1, 1, 1, 1);
        var heading = new StiPageHeaderBand { Name = "Heading", Height = 5.5 };
        page.Components.Add(heading);
        Text(heading, "Title", "{Invoice.Title}", 0, 0, 27.7, .8, 15, true);
        Text(heading, "Number", "{Invoice.Number}", 15, .9, 8.7, .5);
        Text(heading, "NumberCaption", "شماره صورتحساب", 23.7, .9, 4, .5);
        Text(heading, "Date", "تاریخ: {Invoice.Date}   |   واحد پول: ریال", 0, .9, 15, .5);
        Party(heading, "Seller", "مشخصات فروشنده", 1.5);
        Party(heading, "Buyer", "مشخصات خریدار", 3.5);

        var header = new StiHeaderBand { Name = "ColumnHeader", Height = .65, PrintOnAllPages = true };
        page.Components.Add(header);
        var detail = new StiDataBand { Name = "InvoiceRows", DataSourceName = "Lines", Height = .75, CanGrow = true, CanBreak = true };
        page.Components.Add(detail);
        string[] fields = ["Row", "Code", "Description", "Quantity", "Unit", "UnitPrice", "Gross", "Discount", "Net", "Vat", "Total"];
        string[] labels = ["ردیف", "کد کالا / خدمت", "شرح کالا یا خدمت", "مقدار", "واحد", "مبلغ واحد", "مبلغ کل", "تخفیف", "پس از تخفیف", "مالیات و عوارض", "مبلغ نهایی"];
        double[] widths = [.9, 2, 7.6, 1.4, 1.4, 2.6, 2.6, 2, 2.6, 2, 2.6];
        double right = 27.7;
        for (var i = 0; i < fields.Length; i++)
        {
            right -= widths[i];
            Text(header, "Header" + i, labels[i], right, 0, widths[i], .9, 8, true);
            Text(detail, "Cell" + i, "{Lines." + fields[i] + "}", right, 0, widths[i], .75, 8);
        }
        var summary = new StiReportSummaryBand { Name = "Summary", Height = 4.1, CanBreak = false };
        page.Components.Add(summary);
        Text(summary, "Totals", "جمع قبل از تخفیف: {Invoice.Gross}     تخفیف: {Invoice.Discount}     پس از تخفیف: {Invoice.Net}", 0, .1, 27.7, .55, 10, true);
        Text(summary, "TaxTotal", "مالیات و عوارض: {Invoice.Vat}     جمع نهایی: {Invoice.Total} ریال", 0, .65, 27.7, .55, 10, true);
        Text(summary, "Words", "مبلغ به حروف: {Invoice.Words}", 0, 1.2, 27.7, .6, 10);
        Text(summary, "Payment", "کسور مالیاتی ثبت‌شده: {Invoice.Withholding}   مبلغ قابل پرداخت: {Invoice.Payable}   مانده: {Invoice.Balance} ریال", 0, 1.8, 27.7, .5, 9);
        Text(summary, "Terms", "سررسید پرداخت: {Invoice.DueDate}    شماره حواله: {Invoice.Waybill}", 0, 2.3, 27.7, .5, 9);
        Text(summary, "SellerSign", "مهر و امضای فروشنده", 14.2, 2.9, 13.5, 1.1, 10);
        Text(summary, "BuyerSign", "مهر و امضای خریدار", 0, 2.9, 14.2, 1.1, 10);
        var footer = new StiPageFooterBand { Name = "PageFooter", Height = .5 };
        page.Components.Add(footer);
        Text(footer, "Pagination", "صفحه {PageNumber} از {TotalPageCount}", 0, 0, 27.7, .5, 8);
        return report;
    }

    public static StiReport CreateLayout(DataSet schema, Accounting.Application.Invoices.Queries.Print.InvoicePrintLayout layout) {
        Stimulsoft.Base.StiFontCollection.AddFontFile(Path.Combine(AppContext.BaseDirectory,"Reporting","Fonts","Vazirmatn-Regular.ttf"));
        var report = new StiReport { ReportUnit = StiReportUnitType.Centimeters, CalculationMode = StiCalculationMode.Interpretation };
        report.RegData(schema); report.Dictionary.Synchronize();
        var page = report.Pages[0];
        var landscape = layout.Format == "a4-landscape";
        var a5 = layout.Format == "a5-portrait";
        page.Orientation = landscape ? StiPageOrientation.Landscape : StiPageOrientation.Portrait;
        page.PageWidth = landscape ? 29.7 : a5 ? 14.8 : 21;
        page.PageHeight = landscape ? 21 : a5 ? 21 : 29.7;
        page.Margins = new StiMargins(layout.Margin, layout.Margin, layout.Margin, layout.Margin);
        var width = page.PageWidth - 2 * layout.Margin;
        var size = layout.FontSize;
        var heading = new StiPageHeaderBand { Name = "Heading", Height = 1.8, CanGrow = true };
        page.Components.Add(heading);
        if(layout.ShowLogo)
        {
            heading.Components.Add(new StiImage(new RectangleD(
                layout.LogoPosition=="left"?0:layout.LogoPosition=="center"?(width-1.5)/2:width-1.5,0,1.5,1.2))
                {Name="BranchLogo",DataColumn="Invoice.LogoBytes",Stretch=true,AspectRatio=true});
        }
        var titleLeft = layout.ShowLogo && layout.LogoPosition == "left" ? 1.6 : 0;
        var titleWidth = width - (layout.ShowLogo && layout.LogoPosition != "center" ? 1.6 : 0);
        var y = layout.ShowLogo && layout.LogoPosition == "center" ? 1.3 : 0;
        Text(heading, "Title", "{Invoice.CustomTitle}", titleLeft, y, titleWidth, .7, size + 3, true);
        Text(heading, "BranchName", "{Invoice.BranchName}", titleLeft, y + .7, titleWidth, .5, size);
        y += 1.3;
        Text(heading, "NumberValue", "{Invoice.Number}", width * .5, y, width * .35, .5, size);
        Text(heading, "NumberCaption", "شماره", width * .85, y, width * .15, .5, size);
        Text(heading, "DateValue", "{Invoice.Date}", 0, y, width * .35, .5, size);
        Text(heading, "DateCaption", "تاریخ", width * .35, y, width * .15, .5, size);
        y += .5;
        if (!string.IsNullOrWhiteSpace(layout.HeaderText)) {
            Text(heading, "HeaderText", "{Invoice.HeaderText}", 0, y, width, .7, size); y += .7;
        }
        void PrintParty(string prefix, string label) {
            Text(heading, prefix + "Label", label + ": {Invoice." + prefix + "Name}", 0, y, width, .5, size, true); y += .5;
            if (layout.ShowContactDetails) {
                Text(heading, prefix + "Contact", "تلفن: {Invoice." + prefix + "Phone}    نشانی: {Invoice." + prefix + "Address}", 0, y, width, .6, size); y += .6;
            }
        }
        if (layout.ShowSeller) PrintParty("Seller", "فروشنده");
        if (layout.ShowBuyer) PrintParty("Buyer", "خریدار");
        heading.Height = y + .15;
        var header = new StiHeaderBand { Name = "ColumnHeader", Height = .65, PrintOnAllPages = true };
        var detail = new StiDataBand { Name = "InvoiceRows", DataSourceName = "Lines", Height = layout.RowHeight, CanGrow = true, CanBreak = true };
        page.Components.Add(header); page.Components.Add(detail);
        var available = new List<(string Field, string Label, double Weight)> {
            ("Row", "ردیف", .6), ("Code", "کد", .9), ("Description", "غذا / خدمت", 3.4),
            ("Quantity", "تعداد", .8), ("Unit", "واحد", .7), ("UnitPrice", "قیمت واحد", 1.5),
            ("Discount", "تخفیف", 1.1), ("Vat", "مالیات", 1.1), ("Total", "جمع ریال", 1.6) };
        var order = layout.ColumnOrder.Split(',').Distinct().ToList();
        // Description, quantity and total remain readable even for an old/custom order.
        foreach (var required in new[] { "Description", "Quantity", "Total" }) if (!order.Contains(required)) order.Add(required);
        var columns = order.Select(key => available.First(c => c.Field == key))
            .Where(c => (c.Field != "Code" || layout.ShowCode) && (c.Field != "Unit" || layout.ShowUnit)
                && (c.Field != "Discount" || layout.ShowDiscount) && (c.Field != "Vat" || layout.ShowTax)).ToList();
        var right = width; var weight = columns.Sum(c => c.Weight);
        for (int i = 0; i < columns.Count; i++) {
            var c = columns[i]; var w = width * c.Weight / weight; right -= w;
            Text(header, "Header" + i, c.Label, right, 0, w, .65, size, true);
            Text(detail, "Cell" + i, "{Lines." + c.Field + "}", right, 0, w, layout.RowHeight, size);
            ((StiText)detail.Components[detail.Components.Count - 1]).TextOptions.RightToLeft = c.Field != "Code";
        }
        foreach (StiText text in header.Components) text.Brush = new StiSolidBrush(ColorTranslator.FromHtml(layout.HeaderColor));
        var summary = new StiReportSummaryBand { Name = "Summary", Height = 1, CanBreak = true, CanGrow = true };
        page.Components.Add(summary);
        double sy = .15;
        void SummaryText(string name, string value, double height = .5, bool bold = false) {
            Text(summary, name, value, 0, sy, width, height, size, bold);
            var text = (StiText)summary.Components[summary.Components.Count - 1];
            text.CanGrow = true; text.CanBreak = true; text.ShiftMode = StiShiftMode.IncreasingSize;
            sy += height;
        }
        void Terms() {
            if (layout.ShowNotes) SummaryText("Notes", "{Invoice.Notes}", .6);
            if (!string.IsNullOrWhiteSpace(layout.Terms)) SummaryText("CustomTerms", "{Invoice.CustomTerms}", .8);
        }
        if (layout.FooterOrder == "terms-first") Terms();
        SummaryText("Totals", "جمع: {Invoice.Gross}    تخفیف: {Invoice.Discount}");
        if (layout.ShowTax) SummaryText("TaxTotal", "مالیات: {Invoice.Vat}");
        SummaryText("FinalTotal", "قابل پرداخت: {Invoice.Payable} ریال", .6, true);
        if (layout.ShowBalance) SummaryText("Balance", "پرداخت‌شده: {Invoice.Paid}    مانده: {Invoice.Balance} ریال");
        if (layout.ShowWords) SummaryText("Words", "به حروف: {Invoice.Words}", .7);
        if (layout.FooterOrder != "terms-first") Terms();
        if (layout.ShowSignatures) SummaryText("Signatures", "امضای فروشنده                         امضای خریدار", .8);
        if (!string.IsNullOrWhiteSpace(layout.FooterText)) SummaryText("FooterText", "{Invoice.FooterText}", .6);
        summary.Height = sy;
        var footer = new StiPageFooterBand { Name = "PageFooter", Height = .4 }; page.Components.Add(footer);
        Text(footer, "Pagination", "صفحه {PageNumber} از {TotalPageCount}", 0, 0, width, .4, size);
        return report;
    }

    private static void Party(StiBand band, string prefix, string title, double y)
    {
        Text(band, prefix + "Label", title, 0, y, 27.7, .4, 9, true);
        Text(band, prefix + "Identity", "نام: {Invoice." + prefix + "Name}     شماره اقتصادی: {Invoice." + prefix + "EconomicNumber}     شناسه ملی / کد ملی: {Invoice." + prefix + "NationalId}", 0, y + .4, 27.7, .6, 9);
        Text(band, prefix + "Contact", "کدپستی: {Invoice." + prefix + "PostalCode}     تلفن: {Invoice." + prefix + "Phone}", 0, y + 1, 27.7, .4, 9);
        Text(band, prefix + "Address", "نشانی: {Invoice." + prefix + "Address}", 0, y + 1.4, 27.7, .6, 9);
    }

    private static void Text(StiBand band, string name, string value, double x, double y, double w, double h, float size = 9, bool bold = false)
    {
        var text = new StiText(new RectangleD(x, y, w, h))
        {
            Name = name, Text = value, Font = Stimulsoft.Base.StiFontCollection.CreateFont("Vazirmatn", size, bold ? FontStyle.Bold : FontStyle.Regular),
            HorAlignment = StiTextHorAlignment.Center, VertAlignment = StiVertAlignment.Center,
            TextOptions = new StiTextOptions { RightToLeft = true, WordWrap = true },
            Border = new StiBorder(StiBorderSides.All, Color.Black, .5, StiPenStyle.Solid),
            CanGrow = band is StiDataBand, GrowToHeight = band is StiDataBand
        };
        // Stimulsoft mirrors horizontal alignment when RightToLeft is enabled.
        if (name.Contains("Address") || name.Contains("Identity") || name == "Words") text.HorAlignment = StiTextHorAlignment.Left;
        if (name is "Number" or "NumberValue" or "DateValue") text.TextOptions.RightToLeft = false;
        band.Components.Add(text);
    }
}
