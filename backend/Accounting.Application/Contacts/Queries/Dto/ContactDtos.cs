namespace Accounting.Application.Contacts.Queries.Dto;

public record CompanyDetailsDto(
    string? TaxNumber,
    string? TaxOffice,
    string? MersisNo,
    string? TicaretSicilNo
);

public record PersonDetailsDto(
    string? Tckn,
    string FirstName,
    string LastName,
    string? Title,
    string? Department
);

public record ContactDetailDto(
    int Id,
    int BranchId,
    string Code,
    string Name, // Display Name
    bool IsCustomer,
    bool IsVendor,
    bool IsEmployee,
    bool IsRetail,
    string? Email,
    string? Phone,
    string? Iban,
    CompanyDetailsDto? CompanyDetails,
    PersonDetailsDto? PersonDetails,
    string RowVersion,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    string? Address = null,
    string? City = null,
    string? District = null,
    string? NationalId = null,
    string? PostalCode = null,
    string? SubscriptionNumber = null
) { public string CustomerNumber => Id.ToString("D6", System.Globalization.CultureInfo.InvariantCulture); }

public record ContactListItemDto(
    int Id,
    int BranchId,
    string Code,
    string Name,
    bool IsCustomer,
    bool IsVendor,
    bool IsEmployee,
    bool IsRetail,
    string? Email,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    string? SubscriptionNumber = null
) { public string CustomerNumber => Id.ToString("D6", System.Globalization.CultureInfo.InvariantCulture); }