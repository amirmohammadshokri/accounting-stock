using Accounting.Domain.Common;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Abstractions;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage;

using Accounting.Application.Common.Interfaces;

namespace Accounting.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly AuditSaveChangesInterceptor _audit;
    private readonly ICurrentUserService _currentUserService;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        AuditSaveChangesInterceptor audit,
        ICurrentUserService currentUserService) : base(options)
    {
        _audit = audit;
        _currentUserService = currentUserService;
    }

    public DbSet<MealPackage> MealPackages => Set<MealPackage>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ContactOpeningBalance> ContactOpeningBalances => Set<ContactOpeningBalance>();
    public DbSet<InventoryOpeningBalance> InventoryOpeningBalances => Set<InventoryOpeningBalance>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<CompanyDetails> CompanyDetails => Set<CompanyDetails>();
    public DbSet<PersonDetails> PersonDetails => Set<PersonDetails>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Accounting.Domain.Entities.Unit> Units => Set<Accounting.Domain.Entities.Unit>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();
    public DbSet<CashBankAccount> CashBankAccounts => Set<CashBankAccount>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Cheque> Cheques => Set<Cheque>();
    public DbSet<CompanySettings> CompanySettings => Set<CompanySettings>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<AuditTrail> AuditTrails => Set<AuditTrail>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.Entity<AuditTrail>().HasIndex(e => e.BranchId);
        modelBuilder.Entity<AuditTrail>().HasQueryFilter(e => !BranchScopeEnforced || ReadAllBranches || e.BranchId == ActiveBranchId);

        foreach (var type in modelBuilder.Model.GetEntityTypes().Select(e => e.ClrType).ToList())
        {
            if (typeof(IHasBranch).IsAssignableFrom(type) && typeof(ISoftDeletable).IsAssignableFrom(type))
                typeof(AppDbContext).GetMethod(nameof(ConfigureBranchFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!
                    .MakeGenericMethod(type).Invoke(this, new object[] { modelBuilder });
        }
        modelBuilder.Entity<InvoiceLine>().HasQueryFilter(e => !e.IsDeleted && (!BranchScopeEnforced || ReadAllBranches || e.Invoice.BranchId == ActiveBranchId));
        modelBuilder.Entity<OrderLine>().HasQueryFilter(e => !e.IsDeleted && (!BranchScopeEnforced || ReadAllBranches || e.Order.BranchId == ActiveBranchId));

    }

    // Context properties are parameterized by EF per DbContext, never captured service constants.
    public bool BranchScopeEnforced => _currentUserService.EnforceBranchScope;
    public bool ReadAllBranches => _currentUserService.AllBranches;
    public int? ActiveBranchId => _currentUserService.BranchId;

    private void ConfigureBranchFilter<T>(ModelBuilder builder) where T : class, IHasBranch, ISoftDeletable
        => builder.Entity<T>().HasQueryFilter(e => !e.IsDeleted && (!BranchScopeEnforced || ReadAllBranches || e.BranchId == ActiveBranchId));

    private void ValidateBranchWrites()
    {
        if (!BranchScopeEnforced) return;
        foreach (var entry in ChangeTracker.Entries().Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            if (entry.Entity is not IHasBranch entity) continue;
            if (!ActiveBranchId.HasValue || entity.BranchId != ActiveBranchId.Value
                || (entry.State != EntityState.Added && (int)entry.Property("BranchId").OriginalValue! != ActiveBranchId.Value))
                throw new ForbiddenAccessException();
        }
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.AddInterceptors(_audit);
    }


    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    => await Database.BeginTransactionAsync(cancellationToken);

    public Task<IDbContextTransaction> BeginTransactionAsync(System.Data.IsolationLevel isolationLevel, CancellationToken cancellationToken = default)
        => Database.IsRelational() ? Database.BeginTransactionAsync(isolationLevel, cancellationToken) : Database.BeginTransactionAsync(cancellationToken);

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ValidateBranchWrites();
        ValidateRialCurrency();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ValidateBranchWrites();
        ValidateRialCurrency();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ValidateRialCurrency()
    {
        // Do not silently relabel historical foreign-currency amounts as rial.
        foreach (var entry in ChangeTracker.Entries()
                     .Where(e => e.State is EntityState.Added or EntityState.Modified))
        {
            if (entry.Entity is not (Invoice or Order or Payment or Cheque or CashBankAccount)) continue;
            var currency = entry.Property("Currency");
            currency.CurrentValue = entry.State == EntityState.Modified
                ? Accounting.Application.Common.Validation.CommonValidationRules.PreserveExistingCurrency((string?)currency.CurrentValue, (string)currency.OriginalValue!)
                : Accounting.Application.Common.Validation.CommonValidationRules.NormalizeAndValidateCurrency((string?)currency.CurrentValue);
            if (entry.Entity is Invoice invoice && invoice.Currency == "IRR" && invoice.CurrencyRate != 1m)
                throw new FluentValidation.ValidationException("نرخ ارز فاکتور ریالی باید برابر با یک باشد.");
        }
    }

    public new EntityEntry Entry(object entity) => base.Entry(entity);

}
