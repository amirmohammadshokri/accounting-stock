namespace Accounting.Application.Common.Validation;
public static class LogoValidation {
    public static bool IsValid(string? value) {
        if (string.IsNullOrEmpty(value)) return true;
        if (value.Length > 410000) return false;
        var png = value.StartsWith("data:image/png;base64,", StringComparison.Ordinal);
        var jpg = value.StartsWith("data:image/jpeg;base64,", StringComparison.Ordinal);
        if (!png && !jpg) return false;
        try {
            var bytes = Convert.FromBase64String(value[(value.IndexOf(',') + 1)..]);
            return bytes.Length <= 307200 && (png
                ? bytes.AsSpan().StartsWith(new byte[] {137,80,78,71,13,10,26,10})
                : bytes.AsSpan().StartsWith(new byte[] {255,216,255}));
        } catch (FormatException) { return false; }
    }
}
