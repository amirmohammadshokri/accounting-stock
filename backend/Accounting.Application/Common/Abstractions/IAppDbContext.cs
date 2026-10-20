using Accounting.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Common.Abstractions;

public interface IAppDbContext
{
    DbSet<ContactOpeningBalance> ContactOpeningBalances { get; }
    DbSet<InventoryOpeningBalance> InventoryOpeningBalances { get; }
    DbSet<Contact> Contacts { get; }
    DbSet<CompanyDetails> CompanyDetails { get; }
    DbSet<PersonDetails> PersonDetails { get; }
    DbSet<MealPackage> MealPackages { get; }
    DbSet<Category> Categories { get; }
    DbSet<Item> Items { get; }
    DbSet<Accounting.Domain.Entities.Unit> Units { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<InvoiceLine> InvoiceLines { get; }
    DbSet<CashBankAccount> CashBankAccounts { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderLine> OrderLines { get; }
    DbSet<Branch> Branches { get; }
    DbSet<Warehouse> Warehouses { get; }
    DbSet<Stock> Stocks { get; }
    DbSet<StockMovement> StockMovements { get; }
    DbSet<Cheque> Cheques { get; }
    DbSet<Domain.Entities.CompanySettings> CompanySettings { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<AuditTrail> AuditTrails { get; }



    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(System.Data.IsolationLevel isolationLevel, CancellationToken cancellationToken = default);

    // concurrency için gerekli
    EntityEntry Entry(object entity);
}
