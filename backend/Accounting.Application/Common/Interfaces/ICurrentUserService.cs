namespace Accounting.Application.Common.Interfaces;

public interface ICurrentUserService
{
    int? UserId { get; }
    int? BranchId { get; }
    bool IsHeadquarters { get; }
    bool IsAdmin { get; }
}
