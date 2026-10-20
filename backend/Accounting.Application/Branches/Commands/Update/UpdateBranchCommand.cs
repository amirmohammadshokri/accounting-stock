using Accounting.Application.Branches.Queries.Dto;
using MediatR;

namespace Accounting.Application.Branches.Commands.Update;

public record UpdateBranchCommand(int Id, string Code, string Name, string RowVersionBase64) : IRequest<BranchDetailDto> { public string? LogoDataUrl { get; init; } public string? Address { get; init; } public string? Phone { get; init; } }