using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Invoices.Queries.Print;
using Microsoft.Extensions.Configuration;
using Stimulsoft.Report;

namespace Accounting.Infrastructure.Reporting;

public sealed record InvoiceMrtVersion(string? Template,string Version);
public sealed class InvoiceMrtStore(IConfiguration config,IInvoicePrintLayoutStore layouts)
{
    public const int MaxBytes=2*1024*1024;
    private readonly object gate=new();
    private string Root=>Path.GetFullPath(config["InvoicePrinting:MrtDirectory"] ?? Path.Combine(AppContext.BaseDirectory,"App_Data","InvoiceMrt"));
    private static void CheckFormat(string format){if(!InvoicePrintLayout.Formats.Contains(format))throw new BusinessRuleException("اندازه کاغذ معتبر نیست.");}
    public InvoiceMrtVersion Read(string format)
    {
        CheckFormat(format);
        lock(gate)
        {
            var path=Path.Combine(Root,format+".mrt");
            return File.Exists(path)?Version(File.ReadAllText(path,Encoding.UTF8)):new(null,"default");
        }
    }
    public string CreateDefault(string format,InvoicePrintDocument document)
    {
        CheckFormat(format);var layout=layouts.Get(format).Layout;
        using var data=InvoiceReportData.ForLayout(document,layout);
        using var report=InvoiceReportTemplate.CreateLayout(data,layout);
        report.Script="";report.Dictionary.DataStore.Clear();
        return report.SaveToJsonString();
    }
    public InvoiceMrtVersion Save(string format,string template,string expectedVersion)
    {
        using var report=LoadValidated(template,format);
        report.Script="";report.Dictionary.DataStore.Clear();
        var clean=report.SaveToJsonString();
        lock(gate)
        {
            if(Read(format).Version!=expectedVersion)throw new ConcurrencyConflictException("قالب توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.");
            Directory.CreateDirectory(Root);var path=Path.Combine(Root,format+".mrt");var temporary=path+"."+Guid.NewGuid().ToString("N")+".tmp";
            try{File.WriteAllText(temporary,clean,Encoding.UTF8);File.Move(temporary,path,true);}
            finally{if(File.Exists(temporary))File.Delete(temporary);}
            return Version(clean);
        }
    }
    public void Reset(string format,string expectedVersion)
    {
        CheckFormat(format);lock(gate)
        {
            if(Read(format).Version!=expectedVersion)throw new ConcurrencyConflictException("قالب تغییر کرده است؛ دوباره بارگذاری کنید.");
            var path=Path.Combine(Root,format+".mrt");if(File.Exists(path))File.Delete(path);
        }
    }
    public string Validate(string format,string template) {using var report=LoadValidated(template,format);return report.SaveToJsonString();}
    public StiReport LoadValidated(string template,string format)
    {
        CheckFormat(format);
        if(string.IsNullOrWhiteSpace(template) || Encoding.UTF8.GetByteCount(template)>MaxBytes)throw new BusinessRuleException("فایل MRT خالی است یا بیش از ۲ مگابایت حجم دارد.");
        try
        {
            using var json=JsonDocument.Parse(template,new JsonDocumentOptions{MaxDepth=64});
            if(json.RootElement.ValueKind!=JsonValueKind.Object)throw new BusinessRuleException("فایل MRT معتبر نیست.");
            ValidateJson(json.RootElement);
            var report=new StiReport();
            try
            {
                report.LoadFromJson(template);
                if(report.ReportUnit!=StiReportUnitType.Centimeters || report.Pages.Count is <1 or >5)throw new BusinessRuleException("قالب باید ۱ تا ۵ صفحه و واحد سانتی‌متر داشته باشد.");
                var width=format=="a5-portrait"?14.8:format=="a4-landscape"?29.7:21;
                var height=format=="a5-portrait"?21:format=="a4-landscape"?21:29.7;
                foreach(Stimulsoft.Report.Components.StiPage page in report.Pages)
                    if(Math.Abs(page.PageWidth-width)>.05 || Math.Abs(page.PageHeight-height)>.05)throw new BusinessRuleException("اندازه صفحه با قالب انتخاب‌شده یکسان نیست.");
                foreach(Stimulsoft.Report.Dictionary.StiDataSource source in report.Dictionary.DataSources)
                    if(source.GetType()!=typeof(Stimulsoft.Report.Dictionary.StiDataTableSource) || source.Name is not ("Invoice" or "Lines"))
                        throw new BusinessRuleException("قالب فقط می‌تواند از داده‌های فاکتور همین سامانه استفاده کند.");
                foreach(Stimulsoft.Report.Dictionary.StiResource resource in report.Dictionary.Resources)
                    if(resource.Type!=Stimulsoft.Report.Dictionary.StiResourceType.Image || !IsSafeImage(resource.Content))
                        throw new BusinessRuleException("منابع قالب فقط می‌توانند تصویر پیوست‌شده PNG یا JPEG تا ۳۰۰ کیلوبایت باشند.");
                report.CalculationMode=StiCalculationMode.Interpretation;report.Script="";report.Dictionary.Databases.Clear();report.Dictionary.DataStore.Clear();
                return report;
            }
            catch{report.Dispose();throw;}
        }
        catch(BusinessRuleException){throw;}
        catch{throw new BusinessRuleException("فایل MRT خوانده نشد؛ قالب سازگار با نسخه 2024.3.2 انتخاب کنید.");}
    }
    private static void ValidateJson(JsonElement node)
    {
        if(node.ValueKind==JsonValueKind.Object)foreach(var property in node.EnumerateObject())
        {
            if(property.Name is "Script" && property.Value.ValueKind==JsonValueKind.String && !string.IsNullOrWhiteSpace(property.Value.GetString()))throw new BusinessRuleException("کدنویسی اسکریپت در قالب چاپ مجاز نیست؛ از فیلدها و اجزای طراح استفاده کنید.");
            if(property.Name is "Databases" or "BusinessObjects" && property.Value.ValueKind==JsonValueKind.Object && property.Value.EnumerateObject().Any())throw new BusinessRuleException("اتصال دیتابیس، فایل داده و منابع خارجی در قالب چاپ مجاز نیست.");
            if(property.Name is "ImageURL" or "ImageFile" or "SubReportUrl" or "ReportFile" && HasValue(property.Value) && !(property.Name=="ImageURL" && IsResourceReference(property.Value)))throw new BusinessRuleException("در قالب از تصویر پیوست‌شده یا فیلد لوگوی شعبه استفاده کنید؛ نشانی خارجی مجاز نیست.");
            ValidateJson(property.Value);
        }
        else if(node.ValueKind==JsonValueKind.Array)foreach(var item in node.EnumerateArray())ValidateJson(item);
        else if(node.ValueKind==JsonValueKind.String && Regex.IsMatch(node.GetString()!,@"(?i)(System\s*\.\s*(IO|Reflection|Diagnostics|Net|Environment|Activator)\s*\.|GetType\s*\(|typeof\s*\(|GetTypeFrom|CreateInstance|Assembly\s*\.|Process\s*\.|File\s*\.|Directory\s*\.|Environment\s*\.|WebClient|HttpClient|Invoke\s*\(|DllImport)"))
            throw new BusinessRuleException("عبارت قالب چاپ شامل دسترسی غیرمجاز به سرور است.");
    }
    private static bool IsResourceReference(JsonElement value)
    {
        if(value.ValueKind==JsonValueKind.String)return value.GetString()!.StartsWith("resource://",StringComparison.OrdinalIgnoreCase);
        return value.ValueKind==JsonValueKind.Object && value.TryGetProperty("Value",out var expression) && IsResourceReference(expression);
    }
    private static bool IsSafeImage(byte[]? bytes)=>bytes is {Length:>0 and <=307200} &&
        (bytes.AsSpan().StartsWith(new byte[]{137,80,78,71,13,10,26,10}) || bytes.AsSpan().StartsWith(new byte[]{255,216,255}));
    private static bool HasValue(JsonElement value)=>value.ValueKind switch{JsonValueKind.String=>!string.IsNullOrWhiteSpace(value.GetString()),JsonValueKind.Object=>value.EnumerateObject().Any(x=>HasValue(x.Value)),JsonValueKind.Null=>false,_=>true};
    private static InvoiceMrtVersion Version(string text)=>new(text,Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))));
}
