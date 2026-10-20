using Accounting.Application.Invoices.Queries.Print;
using Microsoft.Extensions.Configuration;
using Stimulsoft.Base;
using Stimulsoft.Report;
using Stimulsoft.Report.Export;

namespace Accounting.Infrastructure.Reporting;

public sealed class StimulsoftInvoicePdfService : IInvoicePdfService
{
    private static readonly object ConfigurationLock = new();
    private static bool initialized;
    private readonly IInvoicePrintLayoutStore layouts;
    private readonly InvoiceMrtStore mrt;
    public StimulsoftInvoicePdfService(IConfiguration config, IInvoicePrintLayoutStore? layouts = null, InvoiceMrtStore? mrt = null)
    {
        this.layouts = layouts ?? new InvoicePrintLayoutStore(config);
        this.mrt=mrt ?? new InvoiceMrtStore(config,this.layouts);
        lock (ConfigurationLock)
        {
            if (initialized) return;
            var key = StimulsoftLicenseConfiguration.GetKey(config);
            if (!string.IsNullOrWhiteSpace(key))
            {
                try { StiLicense.Key = key; }
                catch { throw new InvalidOperationException("کلید مجوز تنظیم‌شده توسط استیمول‌سافت پذیرفته نشد."); }
            }
            // Use the bundled font data, rather than GDI glyph indices from a fallback font.
            // Full embedding also keeps Persian presentation forms stable across PDF viewers.
            StiOptions.Export.Pdf.AllowInvokeWindowsLibraries = false;
            StiOptions.Export.Pdf.ReduceFontFileSize = false;
            StiFontCollection.AddFontFile(Path.Combine(AppContext.BaseDirectory, "Reporting", "Fonts", "Vazirmatn-Regular.ttf"));
            initialized = true;
        }
    }

    public InvoicePdf Render(InvoicePrintDocument document)
    {
        var requested = document.Layout;
        var saved = layouts.Get(requested?.Format ?? "a4-portrait");
        var layout = document.IsLayoutPreview && requested != null ? requested : saved.Layout;
        System.ComponentModel.DataAnnotations.Validator.ValidateObject(layout, new System.ComponentModel.DataAnnotations.ValidationContext(layout), true);
        using var data=InvoiceReportData.ForLayout(document,layout);
        var template=document.MrtTemplate ?? (!document.IsLayoutPreview ? mrt.Read(layout.Format).Template : null);
        using var report=template==null ? InvoiceReportTemplate.CreateLayout(data,layout) : mrt.LoadValidated(template,layout.Format);
        report.Dictionary.DataStore.Clear();
        report.CalculationMode = StiCalculationMode.Interpretation;
        report.Dictionary.Databases.Clear();
        report.RegData(data);
        report.Render(false);
        using var stream = new MemoryStream();
        report.ExportDocument(StiExportFormat.Pdf, stream, new StiPdfExportSettings { EmbeddedFonts = true, UseUnicode = true });
        return new InvoicePdf(stream.ToArray(), $"Invoice-{document.Id}-{layout.Format}.pdf");
    }
}
