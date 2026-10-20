using Accounting.Application.Invoices.Queries.Print;
using Accounting.Infrastructure.Reporting;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Text.Json;
var root=Path.GetFullPath(args.ElementAtOrDefault(1) ?? "output/verification/mrt-fixtures");Directory.CreateDirectory(root);
var config=new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>{["InvoicePrinting:LayoutDirectory"]=Path.Combine(root,"layouts"),["InvoicePrinting:MrtDirectory"]=Path.Combine(root,"saved")}).Build();
var layouts=new InvoicePrintLayoutStore(config);var store=new InvoiceMrtStore(config,layouts);var pdf=new StimulsoftInvoicePdfService(config,layouts,store);
foreach(var format in new[]{"a4-portrait","a5-portrait"})
{
    var document=InvoiceDesignerSample.Create();var template=store.CreateDefault(format,document);
    if(args.FirstOrDefault()=="verify")
    {
        template=File.ReadAllText(Path.Combine(root,"edited-"+format+".mrt"));
        var saved=store.Save(format,template,store.Read(format).Version);
        if(!saved.Template!.Contains("MRT-ROUNDTRIP"))throw new Exception("Edited title was lost");
    }
    else
    {
        File.WriteAllText(Path.Combine(root,format+".mrt"),template);
        using var data=InvoiceReportData.ForLayout(document,layouts.Get(format).Layout);
        var rows=data.Tables.Cast<DataTable>().ToDictionary(t=>t.TableName,t=>t.Rows.Cast<DataRow>().Select(row=>t.Columns.Cast<DataColumn>().ToDictionary(c=>c.ColumnName,c=>row[c] is DBNull?null:row[c])).ToArray());
        File.WriteAllText(Path.Combine(root,format+".json"),JsonSerializer.Serialize(new{template,version="default",isCustom=false,data=rows,designerLicenseKey=(string?)null}));
    }
    using var report=store.LoadValidated(template,format);
    var result=pdf.Render(document with {Layout=new InvoicePrintLayout{Format=format}});
    if(result.Content.Length<1000 || !result.Content.Take(5).SequenceEqual("%PDF-"u8.ToArray()))throw new Exception("Invalid PDF");
    File.WriteAllBytes(Path.Combine(root,format+".pdf"),result.Content);
    Console.WriteLine($"PASS {format}: MRT loaded, PDF {result.Content.Length} bytes");
}
