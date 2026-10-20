using Accounting.Application.Invoices.Queries.Print;
using Accounting.Application.Common.Exceptions;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
namespace Accounting.Infrastructure.Reporting;

public sealed class InvoicePrintLayoutStore(IConfiguration config) : IInvoicePrintLayoutStore {
    private readonly object gate = new();
    private string Root => Path.GetFullPath(config["InvoicePrinting:LayoutDirectory"] ?? Path.Combine(AppContext.BaseDirectory, "App_Data", "InvoiceLayouts"));
    private static void Check(string format) {
        if (!InvoicePrintLayout.Formats.Contains(format)) throw new BusinessRuleException("اندازه کاغذ معتبر نیست.");
    }
    public InvoicePrintLayoutVersion Get(string format) {
        Check(format);
        lock (gate) {
            var path = Path.Combine(Root, format + ".json");
            if (!File.Exists(path)) return new(new InvoicePrintLayout { Format = format }, "default");
            var json = File.ReadAllText(path);
            return new(JsonSerializer.Deserialize<InvoicePrintLayout>(json)!, Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json))));
        }
    }
    public InvoicePrintLayoutVersion Save(InvoicePrintLayout layout, string version) {
        Check(layout.Format);
        lock (gate) {
            if (Get(layout.Format).Version != version) throw new BusinessRuleException("قالب توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.");
            Directory.CreateDirectory(Root);
            var path = Path.Combine(Root, layout.Format + ".json");
            var temp = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try { File.WriteAllText(temp, JsonSerializer.Serialize(layout)); File.Move(temp, path, true); }
            finally { if (File.Exists(temp)) File.Delete(temp); }
            return Get(layout.Format);
        }
    }
}
