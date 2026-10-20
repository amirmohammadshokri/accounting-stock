

namespace Accounting.Domain.Entities;

public class PersonDetails
{
    public int ContactId { get; set; }

    public string? Tckn { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;

    // Employee Specific
    public string? Title { get; set; } // Unvan
    public string? Department { get; set; } // Bölüm
}
