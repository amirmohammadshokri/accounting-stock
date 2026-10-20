using FluentValidation;

namespace Accounting.Application.Warehouses.Commands.Delete;

public class SoftDeleteWarehouseValidator : AbstractValidator<SoftDeleteWarehouseCommand>
{
    public SoftDeleteWarehouseValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.RowVersion).NotEmpty();
    }
}
