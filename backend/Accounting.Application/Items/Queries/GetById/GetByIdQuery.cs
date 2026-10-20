using Accounting.Application.Items.Queries.Dto;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace Accounting.Application.Items.Queries.GetById;

public record GetItemByIdQuery(int Id) : IRequest<ItemDetailDto>;
