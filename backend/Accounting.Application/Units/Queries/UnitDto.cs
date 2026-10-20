namespace Accounting.Application.Units.Queries;

public record UnitDetailDto(int Id, string Name, string? Description, string RowVersion,
    DateTime CreatedAtUtc, DateTime? UpdatedAtUtc);

public record UnitListItemDto(int Id, string Name, string? Description, string RowVersion,
    DateTime CreatedAtUtc, DateTime? UpdatedAtUtc);
