using Accounting.Application.Common.Abstractions;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Common.Extensions;
using Accounting.Application.Common.Interfaces;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Invoices.Queries.Print;

public sealed class InvoicePrintDocumentLoader(IAppDbContext db, ICurrentUserService user)
{
    public async Task<InvoicePrintDocument> LoadAsync(int id,CancellationToken ct)
    {
        var invoice = await db.Invoices.ApplyBranchFilter(user).AsNoTracking()
            .Include(x => x.Contact).Include(x => x.Branch).Include(x => x.Lines)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Invoice", id);

        if (invoice.Currency != "IRR")
            throw new BusinessRuleException("چاپ ریالی برای فاکتور دارای ارز دیگری مجاز نیست.");

        var company = await db.CompanySettings.AsNoTracking().OrderBy(x => x.Id).FirstOrDefaultAsync(ct)
            ?? new Accounting.Domain.Entities.CompanySettings { Title = invoice.Branch?.Name ?? "کترینگ" };
        var contact = invoice.Contact;
        var own = new InvoicePrintParty(company.Title, company.TaxNumber, company.NationalId,
            company.PostalCode, invoice.Branch?.Address ?? company.Address, invoice.Branch?.Phone ?? company.Phone);
        var other = new InvoicePrintParty(contact.Name, contact.CompanyDetails?.TaxNumber,
            contact.NationalId ?? contact.PersonDetails?.Tckn, contact.PostalCode,
            string.Join("، ", new[] { contact.City, contact.District, contact.Address }
                .Where(x => !string.IsNullOrWhiteSpace(x))), contact.Phone) { CustomerNumber = Accounting.Application.Contacts.SubscriptionNumbers.Display(contact.Id, contact.SubscriptionNumber) };
        var purchase = invoice.Type is InvoiceType.Purchase or InvoiceType.PurchaseReturn;
        var title = invoice.Type switch
        {
            InvoiceType.Sales => "فاکتور فروش",
            InvoiceType.Purchase => "فاکتور خرید",
            InvoiceType.SalesReturn => "برگشت از فروش",
            _ => "برگشت از خرید"
        };
        var lines = invoice.Lines.OrderBy(x => x.Id).Select((x, i) => new InvoicePrintLine(
            i + 1, x.ItemCode, x.ItemName, x.Unit, x.Qty, x.UnitPrice, x.Gross,
            x.DiscountAmount, x.Net, x.VatRate, x.Vat, x.GrandTotal)).ToList();
        return new InvoicePrintDocument(invoice.Id, invoice.InvoiceNumber, invoice.DateUtc,
            title, purchase ? other : own, purchase ? own : other, lines,
            invoice.TotalLineGross, invoice.TotalDiscount, invoice.TotalNet, invoice.TotalVat,
            invoice.TotalGross, invoice.TotalWithholding, invoice.Balance,
            invoice.PaymentDueDateUtc, invoice.WaybillNumber) { Notes = invoice.Notes, BranchName = invoice.Branch?.Name, LogoDataUrl = invoice.Branch?.LogoDataUrl ?? (Accounting.Application.Common.Validation.LogoValidation.IsValid(company.LogoUrl) ? company.LogoUrl : null) };
    }
}
