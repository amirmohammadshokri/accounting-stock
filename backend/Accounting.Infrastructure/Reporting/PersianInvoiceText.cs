using System.Globalization;
namespace Accounting.Infrastructure.Reporting;
public static class PersianInvoiceText
{
    public static string Digits(string value) => string.Concat(value.Select(c => c is >= '0' and <= '9' ? (char)('۰' + c - '0') : c));
    public static string Amount(decimal v) => Digits(v.ToString("N2", CultureInfo.InvariantCulture));
    public static string Quantity(decimal v) => Digits(v.ToString("0.###", CultureInfo.InvariantCulture));
    public static string Price(decimal v) => Digits(v.ToString("#,##0.####", CultureInfo.InvariantCulture));
    public static string Date(DateTime v)
    {
        var c = new PersianCalendar();
        return Digits($"{c.GetYear(v):0000}/{c.GetMonth(v):00}/{c.GetDayOfMonth(v):00}");
    }
    public static string InWords(decimal value)
    {
        value = Math.Round(value, 2, MidpointRounding.AwayFromZero);
        var negative = value < 0; value = Math.Abs(value);
        var whole = decimal.Truncate(value); var fraction = (int)((value - whole) * 100);
        string[] scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون", "کوادریلیون", "کوینتیلیون", "سکستیلیون", "سپتیلیون", "اکتیلیون"];
        var parts = new List<string>(); var scale = 0;
        do { var group = (int)(whole % 1000); if (group > 0) parts.Insert(0, Group(group) + (scale == 0 ? "" : " " + scales[scale])); whole = decimal.Truncate(whole / 1000); scale++; } while (whole > 0);
        var text = parts.Count == 0 ? "صفر" : string.Join(" و ", parts);
        if (fraction > 0) text += " و " + Group(fraction) + " صدم";
        return (negative ? "منفی " : "") + text + " ریال";
    }
    private static string Group(int v)
    {
        string[] small = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
        string[] tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
        string[] hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
        var parts = new List<string>();
        if (v >= 100) { parts.Add(hundreds[v / 100]); v %= 100; }
        if (v >= 20) { parts.Add(tens[v / 10]); v %= 10; }
        if (v > 0) parts.Add(small[v]);
        return string.Join(" و ", parts);
    }
}
