using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Infrastructure.Persistence.Seed;
using Accounting.Infrastructure.Authentication;
using Accounting.Infrastructure.Services;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

var current = new SeedUser();
await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase(Guid.NewGuid().ToString(), options => options.EnableNullChecks(false)).Options, new AuditSaveChangesInterceptor(current), current);
var hasher = new PasswordHasher();
await Seed();
var counts = Counts();
if (db.Users.Count() != 6 || db.Roles.Count() != 6 || db.Items.Count() != 19) throw new Exception("Missing demo data");
foreach (var user in db.Users.Include(u => u.UserRoles).ThenInclude(r => r.Role))
{
    CheckPersian(user.FirstName); CheckPersian(user.LastName);
    if (user.UserRoles.Count != 1 || !hasher.VerifyPassword(user.PasswordHash, "Demo1405!")) throw new Exception("User login/role invalid");
}
foreach (var role in db.Roles.Include(r => r.Permissions)) { CheckPersian(role.Name); CheckPersian(role.Description!); if (role.Permissions.Count == 0) throw new Exception("Empty permissions"); }
foreach (var item in db.Items.Include(i => i.Unit)) { CheckPersian(item.Name); CheckPersian(item.Unit.Name); }
foreach (var contact in db.Contacts)
    if (string.IsNullOrEmpty(contact.NationalId) || contact.PostalCode?.Length != 10 || string.IsNullOrEmpty(contact.Address)) throw new Exception("Contact cannot print");
foreach (var invoice in db.Invoices.Include(i => i.Lines))
{
    if (invoice.BranchId != db.Contacts.Find(invoice.ContactId)!.BranchId) throw new Exception("Invoice branch mismatch");
    if (invoice.TotalLineGross != invoice.Lines.Sum(l => l.Gross) ||
        invoice.TotalGross != invoice.Lines.Sum(l => l.GrandTotal)) throw new Exception("Invoice totals mismatch");
    var paid = db.Payments.Where(p => p.LinkedInvoiceId == invoice.Id).Sum(p => p.Amount);
    if (invoice.Balance != invoice.TotalGross - paid) throw new Exception("Invoice balance mismatch");
}
foreach (var payment in db.Payments)
{
    if (payment.BranchId != db.CashBankAccounts.Find(payment.AccountId)!.BranchId
        || payment.BranchId != db.Contacts.Find(payment.ContactId)!.BranchId) throw new Exception("Payment branch mismatch");
    if (payment.LinkedInvoiceId is int id && payment.ContactId != db.Invoices.Find(id)!.ContactId) throw new Exception("Payment contact mismatch");
}
foreach (var stock in db.Stocks)
{
    var sum = db.StockMovements.Where(m => m.WarehouseId == stock.WarehouseId && m.ItemId == stock.ItemId)
        .AsEnumerable().Sum(m => StockQuantityCalculator.IsIncoming(m.Type) ? m.Quantity : -m.Quantity);
    if (sum != stock.Quantity || sum < 0) throw new Exception("Stock mismatch");
}
var hash = db.Users.First().PasswordHash;
await Seed();
if (Counts() != counts || db.Users.First().PasswordHash != hash) throw new Exception("Repeated seed changed data");
db.Users.Add(new() { Email = "custom@example.com", FirstName = "کاربر", LastName = "اختصاصی", PasswordHash = "unchanged" });
await db.SaveChangesAsync();
await Seed();
if (db.Users.Single(u => u.Email == "custom@example.com").PasswordHash != "unchanged") throw new Exception("Custom user changed");
var ctx = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role,"مدیر سامانه") }, "test")) };
if (!new CurrentUserService(new HttpContextAccessor { HttpContext = ctx }).IsAdmin) throw new Exception("Persian admin not recognized");
Console.WriteLine("PASS fresh Persian seed: " + counts);
Console.WriteLine("PASS roles/passwords, printable identities, branch links, invoice balances, stock movements");
Console.WriteLine("PASS repeated seed and preservation of custom users; Persian admin authorization");
Task Seed() => DataSeeder.SeedAsync(db, new InvoiceBalanceService(db), new AccountBalanceService(db), hasher);
string Counts() => string.Join(",", new[] { db.Users.Count(), db.Roles.Count(), db.Units.Count(), db.Branches.Count(), db.Contacts.Count(), db.Items.Count(), db.Invoices.Count(), db.Orders.Count(), db.Payments.Count(), db.Cheques.Count(), db.Stocks.Count(), db.StockMovements.Count() });
static void CheckPersian(string text) { if (!text.Any(c => c >= 'ا' && c <= 'ی') || text.Any(c => c is >= 'A' and <= 'Z' or >= 'a' and <= 'z')) throw new Exception("Non Persian label: " + text); }
sealed class SeedUser : ICurrentUserService { public int? UserId => null; public int? BranchId => null; public bool IsAdmin => true; public bool IsHeadquarters => true; }
