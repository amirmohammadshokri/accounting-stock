using Accounting.Application.Common.Validation;
using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Accounting.Application.Common.Interfaces;

namespace Accounting.Application.Cheques.Commands.Create;

public class CreateChequeHandler(IAppDbContext db, ICurrentUserService currentUserService) : IRequestHandler<CreateChequeCommand, int>
{
    public async Task<int> Handle(CreateChequeCommand request, CancellationToken ct)
    {
        var branchId = currentUserService.BranchId ?? throw new UnauthorizedAccessException();
        // Duplicate check: Aynı şubede aynı çek numarası olamaz
        var exists = await db.Cheques.AnyAsync(c =>
            c.BranchId == branchId &&
            c.ChequeNumber == request.ChequeNumber &&
            !c.IsDeleted, ct);

        if (exists)
            throw new BusinessRuleException($"شماره چک ({request.ChequeNumber}) قبلاً ثبت شده است.");

        var cheque = new Cheque
        {
            BranchId = branchId,
            ContactId = request.ContactId,
            Type = request.Type,
            Direction = request.Direction,
            Status = ChequeStatus.Pending, // Yeni evrak 'Portföyde' başlar
            ChequeNumber = request.ChequeNumber,
            IssueDate = request.IssueDate,
            DueDate = request.DueDate,
            Amount = request.Amount,
            Currency = CommonValidationRules.NormalizeAndValidateCurrency(request.Currency),
            BankName = request.BankName,
            BankBranch = request.BankBranch,
            AccountNumber = request.AccountNumber,
            DrawerName = request.DrawerName,
            Description = request.Description
        };

        db.Cheques.Add(cheque);
        await db.SaveChangesAsync(ct);

        return cheque.Id;
    }
}
