using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Common;

namespace Accounting.Application.Common.Extensions;

/// <summary>
/// Extension methods for applying branch-based security filtering to queries.
/// </summary>
public static class BranchFilterExtensions
{
    /// <summary>
    /// Applies branch-based visibility filter to entities that implement IHasBranch.
    /// Users can see data if they are Admin, assigned to Headquarters, or the data belongs to their branch.
    /// </summary>
    /// <typeparam name="T">Entity type that implements IHasBranch</typeparam>
    /// <param name="query">The queryable to filter</param>
    /// <param name="currentUserService">Current user service containing user context</param>
    /// <returns>Filtered queryable</returns>
    public static IQueryable<T> ApplyBranchFilter<T>(
        this IQueryable<T> query, 
        ICurrentUserService currentUserService) where T : class, IHasBranch
    {
        // Admin users see everything
        if (currentUserService.IsAdmin)
            return query;

        // Headquarters users see everything
        if (currentUserService.IsHeadquarters)
            return query;

        // Regular users see only their branch data
        if (currentUserService.BranchId.HasValue)
        {
            return query.Where(e => e.BranchId == currentUserService.BranchId.Value);
        }

        // No branch assigned - return empty set for safety
        return query.Where(e => false);
    }
}
