namespace Accounting.Application.Branches.Queries.Dto;

public record BranchDetailDto(
    int Id, 
    string Code, 
    string Name, 
    string RowVersion,
    DateTime CreatedAtUtc, 
    DateTime? UpdatedAtUtc
) { public string? LogoDataUrl { get; init; } public string? Address { get; init; } public string? Phone { get; init; } }

public record BranchListItemDto(
    int Id, 
    string Code, 
    string Name, 
    DateTime CreatedAtUtc, 
    DateTime? UpdatedAtUtc
) { public string? LogoDataUrl { get; init; } public string? Address { get; init; } public string? Phone { get; init; } }
