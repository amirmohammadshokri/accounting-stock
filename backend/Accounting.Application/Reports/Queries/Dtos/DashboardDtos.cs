using Accounting.Application.Common.JsonConverters;
using System.Text.Json.Serialization;

namespace Accounting.Application.Reports.Queries.Dtos;

public record DashboardStatsDto(
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal DailySalesTotal,

    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal DailyCollectionsTotal,

    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal TotalReceivables,

    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal TotalPayables,

    List<CashStatusDto> CashStatus
) { [JsonConverter(typeof(AmountJsonConverter))] public decimal DailyPurchasesTotal { get; init; } }

public record CashStatusDto(
    int Id,
    string Name,
    string Type,

    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal Balance,

    string Currency
);
