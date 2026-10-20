using FluentValidation;

namespace Accounting.Application.StockMovements.Commands.Create;

public class CreateStockMovementValidator : AbstractValidator<CreateStockMovementCommand>
{
    public CreateStockMovementValidator()
    {
        RuleFor(x => x.WarehouseId).GreaterThan(0);
        RuleFor(x => x.ItemId).GreaterThan(0);

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("مقدار باید بیشتر از صفر باشد.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("نوع گردش انبار نامعتبر است.");

        RuleFor(x => x.Note).MaximumLength(500);
    }
}
