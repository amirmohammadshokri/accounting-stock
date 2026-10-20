using Accounting.Application.Common.Abstractions;
using Accounting.Application.Contacts.Queries.Dto;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Contacts.Commands.Create;

public class CreateContactHandler : IRequestHandler<CreateContactCommand, ContactDetailDto>
{
    private readonly IAppDbContext _db;
    public CreateContactHandler(IAppDbContext db) => _db = db;

    public async Task<ContactDetailDto> Handle(CreateContactCommand req, CancellationToken ct)
    {
        var subscription = await SubscriptionNumbers.EnsureAvailable(_db, req.SubscriptionNumber, 0, ct);
        // Auto-generate Code: CRI-{BranchId}-{Sequence}
        var code = await GenerateCodeAsync(req.BranchId, ct);

        // Derive Name
        string displayName = req.Name;
        // If PersonDetails provided, use First+Last as Name (Name param ignored for persons usually, or used as backup)
        if (req.PersonDetails != null)
        {
            displayName = $"{req.PersonDetails.FirstName} {req.PersonDetails.LastName}".Trim();
        }

        var entity = new Contact
        {
            BranchId = req.BranchId,
            Code = code,
            SubscriptionNumber = subscription,
            Name = displayName,
            
            // Flags
            IsCustomer = req.IsCustomer,
            IsVendor = req.IsVendor,
            IsEmployee = req.IsEmployee,
            IsRetail = req.IsRetail,

            // Common
            Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim(),
            Phone = req.Phone,
            Iban = req.Iban,
            NationalId = req.NationalId?.Trim(),
            PostalCode = req.PostalCode?.Trim(),
            Address = req.Address,
            City = req.City,
            District = req.District,

            // Composition
            CompanyDetails = (req.CompanyDetails != null) 
                ? new CompanyDetails 
                { 
                    TaxNumber = req.CompanyDetails.TaxNumber,
                    TaxOffice = req.CompanyDetails.TaxOffice,
                    MersisNo = req.CompanyDetails.MersisNo,
                    TicaretSicilNo = req.CompanyDetails.TicaretSicilNo
                } 
                : null,

            PersonDetails = (req.PersonDetails != null)
                ? new PersonDetails
                {
                    Tckn = req.PersonDetails.Tckn,
                    FirstName = req.PersonDetails.FirstName,
                    LastName = req.PersonDetails.LastName,
                    Title = req.PersonDetails.Title,
                    Department = req.PersonDetails.Department
                }
                : null
        };

        if (req.IsEmployee && entity.PersonDetails == null)
        {
            throw new Exception("ثبت کارمند نیازمند تکمیل مشخصات شخص حقیقی است.");
        }

        _db.Contacts.Add(entity);
        await _db.SaveChangesAsync(ct);

        return new ContactDetailDto(
            entity.Id,
            entity.BranchId,
            entity.Code,
            entity.Name,
            entity.IsCustomer,
            entity.IsVendor,
            entity.IsEmployee,
            entity.IsRetail,
            entity.Email,
            entity.Phone,
            entity.Iban,
            entity.CompanyDetails != null ? new CompanyDetailsDto(entity.CompanyDetails.TaxNumber, entity.CompanyDetails.TaxOffice, entity.CompanyDetails.MersisNo, entity.CompanyDetails.TicaretSicilNo) : null,
            entity.PersonDetails != null ? new PersonDetailsDto(entity.PersonDetails.Tckn, entity.PersonDetails.FirstName, entity.PersonDetails.LastName, entity.PersonDetails.Title, entity.PersonDetails.Department) : null,
            Convert.ToBase64String(entity.RowVersion),
            entity.CreatedAtUtc,
            entity.UpdatedAtUtc,
            entity.Address, entity.City, entity.District, entity.NationalId, entity.PostalCode, SubscriptionNumbers.Display(entity.Id, entity.SubscriptionNumber)
            );
    }

    private async Task<string> GenerateCodeAsync(int branchId, CancellationToken ct)
    {
        // Şubeye ait en son Contact kodunu bul
        var lastCode = await _db.Contacts
            .IgnoreQueryFilters() // Soft-deleted olanları da say
            .Where(c => c.BranchId == branchId)
            .OrderByDescending(c => c.Id)
            .Select(c => c.Code)
            .FirstOrDefaultAsync(ct);

        int nextSequence = 1;

        if (!string.IsNullOrEmpty(lastCode))
        {
            // Format: CRI-{BranchId}-{Sequence}
            var parts = lastCode.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var lastSeq))
            {
                nextSequence = lastSeq + 1;
            }
        }

        return $"CRI-{branchId}-{nextSequence:D5}";
    }
}
