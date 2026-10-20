using Accounting.Application.Common.Abstractions;
using MediatR;

namespace Accounting.Application.Contacts.Commands.Delete;

public record SoftDeleteContactCommand(
    int Id,
    string RowVersion
    ) : IRequest;