using Accounting.Application.Common.Abstractions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.StockMovements.Commands.Transfer;

public class TransferStockValidator : AbstractValidator<TransferStockCommand>
{
    private readonly IAppDbContext _db;

    public TransferStockValidator(IAppDbContext db)
    {
        _db = db;

        RuleFor(x => x.SourceWarehouseId)
            .GreaterThan(0)
            .MustAsync(WarehouseExistsAsync).WithMessage("انبار مبدأ یافت نشد.")
            .NotEqual(x => x.TargetWarehouseId).WithMessage("انبار مبدأ و مقصد نمی‌توانند یکسان باشند.");

        RuleFor(x => x.TargetWarehouseId)
            .GreaterThan(0)
            .MustAsync(WarehouseExistsAsync).WithMessage("انبار مقصد یافت نشد.");

        RuleFor(x => x.ItemId)
            .GreaterThan(0)
            .MustAsync(ItemExistsAsync).WithMessage("کالا یافت نشد.");    

        RuleFor(x => x.TransactionDateUtc)
            .NotEmpty();

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }

    private async Task<bool> WarehouseExistsAsync(int warehouseId, CancellationToken ct)
    {
        return await _db.Warehouses.AnyAsync(w => w.Id == warehouseId, ct);
    }

    private async Task<bool> ItemExistsAsync(int itemId, CancellationToken ct)
    {
        return await _db.Items.AnyAsync(i => i.Id == itemId, ct);
    }
}
