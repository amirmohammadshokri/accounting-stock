using System.Threading;
using System.Threading.Tasks;
using Accounting.Application.Common.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore.Storage;

namespace Accounting.Application.Common.Behaviors;

// Aynı async akışta nested transaction açılmasını engellemek için
internal static class TransactionContext
{
    public static readonly AsyncLocal<bool> InTransaction = new();
}

public class TransactionBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IAppDbContext _db;

    public TransactionBehavior(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        // Sadece ITransactionalRequest işaretli komutlarda çalış
        if (request is not ITransactionalRequest)
            return await next();

        // Zaten transaction içindeysek (ör: Mediator.Send ile iç içe çağrı) yeni transaction açmayalım
        if (TransactionContext.InTransaction.Value)
            return await next();

        TransactionContext.InTransaction.Value = true;
        IDbContextTransaction? tx = null;

        try
        {
            tx = await _db.BeginTransactionAsync(ct); // IAppDbContext üstünden başlat
            var response = await next();
            await tx.CommitAsync(ct);
            return response;
        }
        catch
        {
            if (tx is not null)
                await tx.RollbackAsync(ct);
            throw;
        }
        finally
        {
            if (tx is not null)
                await tx.DisposeAsync();
            TransactionContext.InTransaction.Value = false;
        }
    }
}
