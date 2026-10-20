

namespace Accounting.Domain.Entities;

public class CompanyDetails
{
    public int ContactId { get; set; }
    // Keeps a company identity present even when all optional tax fields are blank.
    public bool IsPresent { get; set; } = true;

    public string? TaxNumber { get; set; }
    public string? TaxOffice { get; set; }
    public string? MersisNo { get; set; }
    public string? TicaretSicilNo { get; set; }

    // Navigation
    // Since we switched to OwnsOne with Table Split/Join behavior or similar, 
    // actually user navigation property is still useful but not attributes.
    // However, configuring as OwnsOne in EF Core implies it's owned. 
    // If I used OwnsOne above, EF Core treats it as Owned Entity.
    // BUT wait, I want separate tables. `OwnsOne(...).ToTable(...)` does table splitting or separate table? 
    // `OwnsOne` + `ToTable` creates a separate table sharing the Key. This is correct for 1:1.
    // So no Key attribute needed.
}
