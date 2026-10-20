using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Invoices.Queries.Print;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Infrastructure.Reporting;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Accounting.Tests;

public class InvoicePrintTests
{
    private sealed class User : ICurrentUserService
    {
        public int? UserId => 1;
        public int? BranchId => 1;
        public bool IsAdmin => false;
        public bool IsHeadquarters => false;
    }
    private sealed class Pdf : IInvoicePdfService
    {
        public InvoicePrintDocument? Document;
        public InvoicePdf Render(InvoicePrintDocument document)
        {
            Document = document;
            return new("%PDF-test"u8.ToArray(), "Invoice.pdf");
        }
    }
    private static AppDbContext Open()
    {
        var user = new User();
        return new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            new AuditSaveChangesInterceptor(user), user);
    }
    private static async Task<Invoice> Seed(AppDbContext db, int branch = 1, InvoiceType type = InvoiceType.Sales)
    {
        db.Branches.Add(new Branch {Id=branch,Code="BR",Name="شعبه"});
        db.CompanySettings.Add(new() { Title = "Our company", TaxNumber = "12345678901234", NationalId = "12345678901", PostalCode = "1234567890", Address = "Tehran" });
        var contact = new Contact { BranchId = branch, Code = "C1", Name = "Customer", NationalId = "0987654321", PostalCode = "0987654321", Address = "Isfahan" };
        var invoice = new Invoice { BranchId = branch, Contact = contact, InvoiceNumber = "INV-1", DateUtc = new(2026, 10, 14), Type = type,
            TotalLineGross = 1000, TotalDiscount = 100, TotalNet = 900, TotalVat = 90, TotalGross = 990, Balance = 500 };
        invoice.Lines.Add(new() { ItemCode = "OLD-CODE", ItemName = "Historical name", Unit = "Historical unit", Qty = 1, UnitPrice = 1000, Gross = 1000, DiscountAmount = 100, Net = 900, VatRate = 10, Vat = 90, GrandTotal = 990 });
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        return invoice;
    }
    [Theory]
    [InlineData(InvoiceType.Sales, "Our company")]
    [InlineData(InvoiceType.Purchase, "Customer")]
    [InlineData(InvoiceType.SalesReturn, "Our company")]
    [InlineData(InvoiceType.PurchaseReturn, "Customer")]
    public async Task Print_PreservesStoredAmountsAndSnapshot_AndOrdersParties(InvoiceType type, string seller)
    {
        using var db = Open();
        var invoice = await Seed(db, type: type);
        var pdf = new Pdf();
        await new GetInvoicePdfHandler(db, new User(), pdf).Handle(new(invoice.Id), default);
        Assert.Equal(seller, pdf.Document!.Seller.Name);
        Assert.Equal(990, pdf.Document.Total);
        Assert.Equal(500, pdf.Document.Balance);
        Assert.Equal("Historical unit", pdf.Document.Lines[0].Unit);
        Assert.Equal("Historical name", pdf.Document.Lines[0].Description);
    }
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task HiddenOrOtherBranchInvoice_CannotBePrinted(bool deleted)
    {
        using var db = Open();
        var invoice = await Seed(db, deleted ? 1 : 2);
        if (deleted) { invoice.IsDeleted = true; await db.SaveChangesAsync(); }
        var pdf = new Pdf();
        await Assert.ThrowsAsync<NotFoundException>(() => new GetInvoicePdfHandler(db, new User(), pdf).Handle(new(invoice.Id), default));
        Assert.Null(pdf.Document);
    }
    [Fact]
    public async Task NormalInvoice_DoesNotRequireFormalIdentity()
    {
        using var db = Open();
        var invoice = await Seed(db);
        invoice.Contact.PostalCode = null;
        await db.SaveChangesAsync();
        var pdf = new Pdf();
        await new GetInvoicePdfHandler(db, new User(), pdf).Handle(new(invoice.Id), default);
        Assert.NotNull(pdf.Document);
        Assert.Equal("a4-portrait", pdf.Document.Layout!.Format);
    }
    [Theory]
    [InlineData(0, "صفر ریال")]
    [InlineData(1250000, "یک میلیون و دویست و پنجاه هزار ریال")]
    [InlineData(1001, "یک هزار و یک ریال")]
    public void AmountInWords_IsRial(decimal value, string expected)
        => Assert.Equal(expected, PersianInvoiceText.InWords(value));
    [Fact]
    public void ReportData_UsesPersianDatesDigitsAndStoredLineValues()
    {
        Assert.Equal("۱۴۰۵/۰۷/۲۲", PersianInvoiceText.Date(new(2026, 10, 14)));
        Assert.Equal("۱,۲۵۰.۵۰", PersianInvoiceText.Amount(1250.5m));
        Assert.Equal("یک و بیست و پنج صدم ریال", PersianInvoiceText.InWords(1.25m));
    }
}
