/**
 * Contact Models (Cariler)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Contacts.Queries.Dto.ContactDtos
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Company Details DTO
 * Şirket bilgileri
 */
export interface CompanyDetailsDto {
  taxNumber?: string | null;        // Vergi Numarası
  taxOffice?: string | null;        // Vergi Dairesi
  mersisNo?: string | null;         // MERSİS No
  ticaretSicilNo?: string | null;   // Ticaret Sicil No
}

/**
 * Person Details DTO
 * Şahıs bilgileri
 */
export interface PersonDetailsDto {
  tckn?: string | null;             // TC Kimlik No
  firstName: string;                // Ad
  lastName: string;                 // Soyad
  title?: string | null;            // Unvan (Müdür, vb.)
  department?: string | null;       // Departman
}

/**
 * Contact Detail DTO (Read)
 * Backend: ContactDto
 */
export interface ContactDto {
  id: number;
  customerNumber?: string;
  subscriptionNumber?: string | null;
  branchId: number;
  code: string;                     // Cari kodu
  name: string;                     // Display name

  // Flags
  isCustomer: boolean;              // Müşteri mi?
  isVendor: boolean;                // Tedarikçi mi?
  isEmployee: boolean;              // Personel mi?
  isRetail: boolean;                // Perakende müşteri mi?

  // Contact info
  email?: string | null;
  nationalId?: string | null;
  postalCode?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  phone?: string | null;
  iban?: string | null;

  // Details (Conditional)
  companyDetails?: CompanyDetailsDto | null;
  personDetails?: PersonDetailsDto | null;

  // Metadata
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

/**
 * Contact List Item DTO (Read)
 * Backend: ContactListItemDto
 */
export interface ContactListItemDto {
  id: number;
  customerNumber?: string;
  subscriptionNumber?: string | null;
  branchId: number;
  code: string;
  name: string;
  isCustomer: boolean;
  isVendor: boolean;
  isEmployee: boolean;
  isRetail: boolean;
  email?: string | null;
  createdAtUtc: string;             // ISO-8601 UTC
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Contacts Query Parameters
 * Backend: ListContactsQuery
 */
export interface ListContactsQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                    // "name:asc", "code:desc"
  search?: string | null;           // Name, code, email search
  isCustomer?: boolean | null;
  isVendor?: boolean | null;
  isEmployee?: boolean | null;
  isRetail?: boolean | null;
  branchId?: number | null;
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Contact Body
 * Backend: CreateContactCommand
 */
export interface CreateContactBody {
  subscriptionNumber?: string | null;
  branchId: number;
  code: string;
  name: string;
  isCustomer: boolean;
  isVendor: boolean;
  isEmployee: boolean;
  isRetail: boolean;
  email?: string | null;
  nationalId?: string | null;
  postalCode?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  phone?: string | null;
  iban?: string | null;
  companyDetails?: CompanyDetailsDto | null;
  personDetails?: PersonDetailsDto | null;
}

/**
 * Update Contact Body
 * Backend: UpdateContactCommand
 */
export interface UpdateContactBody {
  id: number;
  customerNumber?: string;
  subscriptionNumber?: string | null;
  rowVersion: string;                // Required for optimistic concurrency (backend: UpdateContactCommand.RowVersion)
  branchId: number;
  code: string;
  name: string;
  isCustomer: boolean;
  isVendor: boolean;
  isEmployee: boolean;
  isRetail: boolean;
  email?: string | null;
  nationalId?: string | null;
  postalCode?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  phone?: string | null;
  iban?: string | null;
  companyDetails?: CompanyDetailsDto | null;
  personDetails?: PersonDetailsDto | null;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Contact type helper
 */
export function getContactType(contact: ContactListItemDto | ContactDto): string {
  const types: string[] = [];
  if (contact.isCustomer) types.push('مشتری');
  if (contact.isVendor) types.push('تأمین‌کننده');
  if (contact.isEmployee) types.push('کارمند');
  if (contact.isRetail) types.push('خرده‌فروشی');
  return types.join(', ') || 'نامشخص';
}

/**
 * Get display name (Person or Company)
 */
export function getContactDisplayName(contact: ContactDto): string {
  if (contact.personDetails) {
    return `${contact.personDetails.firstName} ${contact.personDetails.lastName}`;
  }
  return contact.name;
}
