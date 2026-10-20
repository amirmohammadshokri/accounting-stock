using Accounting.Application.Invoices.Queries.Print;
using Accounting.Infrastructure.Reporting;
using Microsoft.Extensions.Configuration;

var output = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../output/pdf"));
Directory.CreateDirectory(output);
var seller = new InvoicePrintParty("شرکت نمونه ایرانی", "۱۲۳۴۵۶۷۸۹۰۱۲۳۴", "۱۲۳۴۵۶۷۸۹۰۱", "۱۲۳۴۵۶۷۸۹۰", "تهران، خیابان نمونه، پلاک ۱۲، ساختمان تجارت، طبقه دوم", "۰۲۱۱۲۳۴۵۶۷۸");
var buyer = new InvoicePrintParty("خریدار نمونه", "۹۸۷۶۵۴۳۲۱۰۱۲۳۴", "۹۸۷۶۵۴۳۲۱۰۱", "۹۸۷۶۵۴۳۲۱۰", "اصفهان، خیابان نمونه، کوچه بهار، پلاک ۲۴", "۰۳۱۱۲۳۴۵۶۷۸");
InvoicePrintDocument Document(int count)
{
    var lines = Enumerable.Range(1, count).Select(i => new InvoicePrintLine(i, "K-" + i,
        i % 3 == 0 ? "کالای نمونه با شرح طولانی برای بررسی شکست سطر و صفحه‌بندی فاکتور رسمی فارسی" : "کالای نمونه ایرانی",
        "عدد", 2, 1250000, 2500000, 100000, 2400000, 10, 240000, 2640000)).ToList();
    return new(42, "INV-1405-001", new DateTime(2026, 10, 14), "صورتحساب فروش کالا و خدمات", seller, buyer, lines,
        2500000 * count, 100000 * count, 2400000 * count, 240000 * count, 2640000 * count, 0,
        2640000 * count, new DateTime(2026, 11, 14), "۱۲۳۴");
}

if (args.Contains("--resave-template"))
{
    var source = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../Accounting.Infrastructure/Reporting/Invoice.mrt"));
    File.Copy(source, Path.Combine(output, "invoice-before-version-change.mrt"), true);
    using var compatible = new Stimulsoft.Report.StiReport();
    compatible.Load(source);
    compatible.Save(source);
    compatible.Save(Path.Combine(AppContext.BaseDirectory, "Reporting", "Invoice.mrt"));
    Console.WriteLine("Template saved by Stimulsoft 2024.3.2.");
}
using (var sample = InvoiceReportData.Create(Document(4)))
{
    sample.WriteXml(Path.Combine(output, "invoice-sample-data.xml"), System.Data.XmlWriteMode.WriteSchema);
    var json = sample.Tables.Cast<System.Data.DataTable>().ToDictionary(table => table.TableName,
        table => table.Rows.Cast<System.Data.DataRow>().Select(row => table.Columns.Cast<System.Data.DataColumn>()
            .ToDictionary(column => column.ColumnName, column => row[column]?.ToString())).ToList());
    File.WriteAllText(Path.Combine(output, "invoice-sample-data.json"), System.Text.Json.JsonSerializer.Serialize(json,
        new System.Text.Json.JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
}

if (args.Contains("--template"))
{
    using var schema = InvoiceReportData.Create(Document(0));
    using var template = InvoiceReportTemplate.Create(schema);
    // Templates contain schema and expressions only, never customer data.
    template.Dictionary.DataStore.Clear();
    var source = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../Accounting.Infrastructure/Reporting/Invoice.mrt"));
    template.Save(source);
    var deployed = Path.Combine(AppContext.BaseDirectory, "Reporting", "Invoice.mrt");
    Directory.CreateDirectory(Path.GetDirectoryName(deployed)!);
    template.Save(deployed);
    Console.WriteLine("Template: " + source);
}

var pdf = new StimulsoftInvoicePdfService(new ConfigurationBuilder().Build());
foreach (var count in new[] { 4, 45 })
{
    var result = pdf.Render(Document(count));
    var path = Path.Combine(output, count == 4 ? "invoice-preview.pdf" : "invoice-multipage-preview.pdf");
    await File.WriteAllBytesAsync(path, result.Content);
    if (!System.Text.Encoding.ASCII.GetString(result.Content, 0, 5).StartsWith("%PDF-")) throw new Exception("Invalid PDF");
    Console.WriteLine(path);
}

if (args.Contains("--layouts")) {
    foreach(var format in new[] {"a4-portrait", "a5-portrait"}) foreach(var count in new[] {4,45}) {
        var result = pdf.Render(Document(count) with { Layout = new InvoicePrintLayout {Format=format}, IsLayoutPreview=true });
        var path = Path.Combine(output,$"invoice-{format}-{count}.pdf");
        await File.WriteAllBytesAsync(path,result.Content); Console.WriteLine(path);
    }
}
