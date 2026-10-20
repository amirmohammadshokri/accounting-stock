namespace Accounting.Application.Roles.Queries.Dto;

public record RoleListItemDto(
    int Id,
    string Name,
    string? Description,
    int PermissionCount
);

public record RoleDetailDto(
    int Id,
    string Name,
    string? Description,
    List<string> Permissions
);
