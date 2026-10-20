using Accounting.Application.Common.Interfaces;

namespace Accounting.Tests.Common;

public class FakeCurrentUserService(int? branchId) : ICurrentUserService
{
    public int? UserIdOverride { get; set; }
    public int? UserId => UserIdOverride ?? 1;
    public int? BranchId => branchId;
    public bool IsHeadquarters { get; set; } = false;
    public bool IsAdmin { get; set; } = false;
}
