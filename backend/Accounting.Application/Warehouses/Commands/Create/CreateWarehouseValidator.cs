using FluentValidation;

namespace Accounting.Application.Warehouses.Commands.Create;

public class CreateWarehouseValidator : AbstractValidator<CreateWarehouseCommand>
{
    public CreateWarehouseValidator()
    {
        // RuleFor(x => x.BranchId).GreaterThan(0); // Removed
        RuleFor(x => x.Code).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
    }
}
