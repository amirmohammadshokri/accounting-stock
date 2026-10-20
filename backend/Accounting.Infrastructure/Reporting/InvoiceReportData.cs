using System.Data;
using Accounting.Application.Invoices.Queries.Print;
namespace Accounting.Infrastructure.Reporting;
public static class InvoiceReportData
{
    public static DataSet ForLayout(InvoicePrintDocument document,InvoicePrintLayout layout)
    {
        var data=Create(document,layout);
        foreach(var pair in new Dictionary<string,string>{["CustomTitle"]=string.IsNullOrWhiteSpace(layout.Title)?document.Title:layout.Title,
            ["HeaderText"]=layout.HeaderText,["CustomTerms"]=layout.Terms,["FooterText"]=layout.FooterText})
        {
            data.Tables["Invoice"]!.Columns.Add(pair.Key,typeof(string));data.Tables["Invoice"]!.Rows[0][pair.Key]=pair.Value;
        }
        data.Tables["Invoice"]!.Columns.Add("LogoBytes",typeof(byte[]));
        if(!string.IsNullOrEmpty(document.LogoDataUrl) && Accounting.Application.Common.Validation.LogoValidation.IsValid(document.LogoDataUrl))
            data.Tables["Invoice"]!.Rows[0]["LogoBytes"]=Convert.FromBase64String(document.LogoDataUrl[(document.LogoDataUrl.IndexOf(',')+1)..]);
        return data;
    }

    public static DataSet Create(InvoicePrintDocument d, InvoicePrintLayout? layout = null)
    {
        var data = new DataSet("InvoicePrint");
        var header = data.Tables.Add("Invoice");
        var values = new Dictionary<string, string>
        {
            ["Notes"] = d.Notes ?? "", ["BranchName"] = d.BranchName ?? "",
            ["Title"] = d.Title, ["Number"] = PersianInvoiceText.Digits(d.Number), ["Date"] = PersianInvoiceText.Date(d.DateUtc),
            ["Gross"] = PersianInvoiceText.Amount(d.Gross), ["Discount"] = PersianInvoiceText.Amount(d.Discount),
            ["Net"] = PersianInvoiceText.Amount(d.Net), ["Vat"] = PersianInvoiceText.Amount(d.Vat),
            ["Total"] = PersianInvoiceText.Amount(d.Total), ["Withholding"] = PersianInvoiceText.Amount(d.Withholding),
            ["Payable"] = PersianInvoiceText.Amount(d.Total - d.Withholding), ["Balance"] = PersianInvoiceText.Amount(d.Balance),
            ["Paid"] = PersianInvoiceText.Amount(d.Total - d.Withholding - d.Balance),
            ["Words"] = PersianInvoiceText.InWords(d.Total),
            ["DueDate"] = d.DueDateUtc.HasValue ? PersianInvoiceText.Date(d.DueDateUtc.Value) : "—",
            ["Waybill"] = PersianInvoiceText.Digits(d.WaybillNumber ?? "—")
        };
        Party("Seller", d.Seller); Party("Buyer", d.Buyer);
        foreach (var key in values.Keys) header.Columns.Add(key, typeof(string));
        header.Rows.Add(values.Values.Cast<object>().ToArray());
        var lines = data.Tables.Add("Lines");
        foreach (var name in new[] { "Row", "Code", "Description", "Quantity", "Unit", "UnitPrice", "Gross", "Discount", "Net", "Vat", "Total" }) lines.Columns.Add(name, typeof(string));
        foreach (var l in d.Lines) lines.Rows.Add(PersianInvoiceText.Digits(l.Row.ToString()), PersianInvoiceText.Digits(l.Code), l.Description,
            PersianInvoiceText.Quantity(l.Quantity), l.Unit, PersianInvoiceText.Price(l.UnitPrice), PersianInvoiceText.Amount(l.Gross),
            PersianInvoiceText.Amount(l.Discount), PersianInvoiceText.Amount(l.Net),
            PersianInvoiceText.Amount(l.Vat) + " (" + PersianInvoiceText.Digits(l.VatRate.ToString()) + "٪)", PersianInvoiceText.Amount(l.Total));
        for (var i = lines.Rows.Count; i < (layout?.MinimumRows ?? 10); i++)
            lines.Rows.Add(Enumerable.Repeat<object>("", lines.Columns.Count).ToArray());
        return data;
        void Party(string prefix, InvoicePrintParty party)
        {
            values[prefix + "Name"] = party.Name + (string.IsNullOrEmpty(party.CustomerNumber) ? "" : " (اشتراک: " + PersianInvoiceText.Digits(party.CustomerNumber) + ")");
            values[prefix + "EconomicNumber"] = PersianInvoiceText.Digits(party.EconomicNumber ?? "—");
            values[prefix + "NationalId"] = PersianInvoiceText.Digits(party.NationalId ?? "—");
            values[prefix + "PostalCode"] = PersianInvoiceText.Digits(party.PostalCode ?? "—");
            values[prefix + "Address"] = PersianInvoiceText.Digits(party.Address ?? "—");
            values[prefix + "Phone"] = PersianInvoiceText.Digits(party.Phone ?? "—");
        }
    }
}
