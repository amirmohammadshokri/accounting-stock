using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Categories.Commands.Delete;

public class DeleteCategoryHandler(IAppDbContext db) : IRequestHandler<DeleteCategoryCommand, bool>
{
    public async Task<bool> Handle(DeleteCategoryCommand r, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(x => x.Id == r.Id && !x.IsDeleted, ct);
        if (category is null)
        {
            throw new NotFoundException("Category", r.Id);
        }

        // Check if used by any items (active items)
        var isUsed = await db.Items.AnyAsync(x => x.CategoryId == r.Id && !x.IsDeleted, ct);
        if (isUsed)
        {
            throw new BusinessRuleException("به دلیل وجود کالاهای مرتبط، این دسته‌بندی قابل حذف نیست.");
        }

        db.Entry(category).Property(nameof(category.RowVersion)).OriginalValue = Convert.FromBase64String(r.RowVersion);

        category.IsDeleted = true;
        category.DeletedAtUtc = DateTime.UtcNow;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException("دسته‌بندی توسط کاربر دیگری تغییر کرده است.");
        }

        return true;
    }
}
