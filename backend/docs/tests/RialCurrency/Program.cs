using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Validation;
using Accounting.Application.Payments.Queries.List;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

static void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
}

Check(CommonValidationRules.NormalizeAndValidateCurrency(null) == "IRR", "Default must be IRR");
Check(CommonValidationRules.NormalizeAndValidateCurrency(" irr ") == "IRR", "Normalize rial");
foreach (var foreign in new[] { "TRY", "USD", "EUR", "GBP", "IRT", "", "ABC" })
{
    Check(!CommonValidationRules.IsValidCurrency(foreign), $"Accepted {foreign}");
    try
    {
        CommonValidationRules.NormalizeAndValidateCurrency(foreign);
        throw new Exception($"Did not reject {foreign}");
    }
    catch (ValidationException) { }
}
Check(new Invoice().Currency == "IRR" && new Order().Currency == "IRR"
    && new Payment().Currency == "IRR" && new Cheque().Currency == "IRR"
    && new CashBankAccount().Currency == "IRR", "Entity defaults");

var validator = new ListPaymentsValidator();
Check(validator.Validate(new ListPaymentsQuery(Currency: "irr")).IsValid, "Rial filter");
Check(validator.Validate(new ListPaymentsQuery()).IsValid, "Optional filter");
Check(!validator.Validate(new ListPaymentsQuery(Currency: "USD")).IsValid, "Foreign filter");

var user = new TestUser();
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlServer("Server=invalid;Database=unused;Integrated Security=true").Options;
foreach (var asynchronous in new[] { false, true })
{
    using var db = new AppDbContext(options, new AuditSaveChangesInterceptor(user), user);
    db.CashBankAccounts.Add(new CashBankAccount { Code = "TEST", Name = "Test", Currency = "USD" });
    try
    {
        if (asynchronous) await db.SaveChangesAsync();
        else db.SaveChanges();
        throw new Exception("Foreign currency reached persistence");
    }
    catch (ValidationException) { }
}
using (var db = new AppDbContext(options, new AuditSaveChangesInterceptor(user), user))
{
    var legacy = new CashBankAccount { Id = 42, Code = "OLD", Name = "Old", Currency = "USD", Balance = 100m };
    db.Attach(legacy);
    legacy.Name = "Edited";
    try { await db.SaveChangesAsync(); throw new Exception("Legacy currency was silently relabelled"); }
    catch (ValidationException) { }
    Check(legacy.Currency == "USD" && legacy.Balance == 100m, "Legacy amount changed");
    legacy.Currency = "IRR";
    try { await db.SaveChangesAsync(); throw new Exception("Legacy relabelling was accepted"); }
    catch (ValidationException) { }
}
using (var db = new AppDbContext(options, new AuditSaveChangesInterceptor(user), user))
{
    db.Invoices.Add(new Invoice { CurrencyRate = 2m });
    try { await db.SaveChangesAsync(); throw new Exception("Exchange rate was accepted"); }
    catch (ValidationException) { }
}
Console.WriteLine("All rial currency checks passed.");

sealed class TestUser : ICurrentUserService
{
    public int? UserId => null;
    public int? BranchId => 1;
    public bool IsHeadquarters => true;
    public bool IsAdmin => true;
}
