using MediatR;

namespace Accounting.Application.Warehouses.Commands.Delete;

public record SoftDeleteWarehouseCommand(int Id, string RowVersion) : IRequest;
