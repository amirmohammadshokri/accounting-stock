namespace Accounting.Infrastructure.Authentication;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    
    // Süreler saniye cinsinden
    public int AccessTokenExpirationSeconds { get; set; } = 900; // 15 dk
    public int RefreshTokenExpirationSeconds { get; set; } = 604800; // 7 gün
}
