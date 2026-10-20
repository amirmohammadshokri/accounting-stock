namespace Accounting.Application.Common.Constants;

/// <summary>
/// Pagination sabitleri - tüm list endpoint'lerde tutarlılık için
/// </summary>
public static class PaginationConstants
{
    public const int DefaultPage = 1;
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;
    public const int MinPageSize = 1;

    /// <summary>
    /// PageSize'ı geçerli aralığa normalize eder
    /// </summary>
    public static int NormalizePageSize(int pageSize)
    {
        if (pageSize < MinPageSize) return DefaultPageSize;
        if (pageSize > MaxPageSize) return MaxPageSize;
        return pageSize;
    }

    /// <summary>
    /// Page numarasını geçerli aralığa normalize eder
    /// </summary>
    public static int NormalizePage(int page)
    {
        return page < 1 ? DefaultPage : page;
    }
}
