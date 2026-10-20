using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace Accounting.Infrastructure.Reporting;

public static class StimulsoftLicenseConfiguration
{
    public static string? GetKey(IConfiguration config, bool forDesigner = false)
    {
        var key = forDesigner ? config["InvoicePrinting:PublicDesignerLicenseKey"] : null;
        if (!string.IsNullOrWhiteSpace(key)) return key;
        key = config["Stimulsoft:LicenseKey"];
        if (!string.IsNullOrWhiteSpace(key)) return key;
        var path = Path.Combine(AppContext.BaseDirectory, "Reporting", "stimulsoft-license.private.json");
        if (!File.Exists(path)) return null;
        try
        {
            using var document = JsonDocument.Parse(File.ReadAllText(path));
            return document.RootElement.GetProperty("LicenseKey").GetString();
        }
        catch
        {
            throw new InvalidOperationException("خواندن تنظیمات خصوصی مجوز استیمول‌سافت ممکن نیست.");
        }
    }
}
