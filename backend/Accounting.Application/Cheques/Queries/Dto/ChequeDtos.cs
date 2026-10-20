using Accounting.Application.Common.JsonConverters;
using System.Text.Json.Serialization;

namespace Accounting.Application.Cheques.Queries.Dto;

public record ChequeDetailDto(
    int Id,
    int BranchId,
    string ChequeNumber,
    string Type, // "Cheque" or "PromissoryNote"
    string Direction, // "Inbound" or "Outbound"

    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal Amount,

    string Currency,
    DateTime IssueDate,
    DateTime DueDate,
    int? ContactId,
    string? ContactName,
    string? DrawerName,
    string? BankName,
    string? Description,
    string Status, // "Pending", "Paid", "Endorsed", "Bounced", "Cancelled"
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    string RowVersionBase64
);

public record ChequeListItemDto(
    int Id,
    string ChequeNumber,
    string Type,

    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal Amount,

    DateTime DueDate,
    string? DrawerName,
    string Status,
    string RowVersionBase64
);
