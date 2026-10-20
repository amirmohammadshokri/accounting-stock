using MediatR;
using System.Data;

namespace Accounting.Application.Items.Commands.Delete;

public record SoftDeleteItemCommand(int Id, string RowVersion) : IRequest<bool>;
