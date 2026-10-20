using Accounting.Application.Payments.Queries.Dto;
using MediatR;

namespace Accounting.Application.Payments.Queries.GetById;

public record GetPaymentByIdQuery(int Id) : IRequest<PaymentDetailDto>;