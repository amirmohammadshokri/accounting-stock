using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Common.Extensions;

public static class BranchFilterExtensions
{
    public static IQueryable<T> ApplyBranchFilter<T>(this IQueryable<T> query,
        ICurrentUserService user) where T : class
    {
        // Shared master data, including contacts, has no operational branch ownership.
        if (!typeof(IHasBranch).IsAssignableFrom(typeof(T))) return query;
        if (user.AllBranches) return query;
        return user.BranchId.HasValue
            ? query.Where(e => EF.Property<int>(e, "BranchId") == user.BranchId.Value)
            : query.Where(e => false);
    }
}
