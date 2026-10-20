/**
 * Company Settings Models (Şirket Ayarları)
 * 
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.CompanySettings.Dto.CompanySettingsDto
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Company Settings DTO (Read)
 * Backend: CompanySettingsDto
 */
export interface CompanySettingsDto {
  id: number;
  nationalId?: string | null;
  postalCode?: string | null;
  title: string;                    // Şirket adı
  taxNumber?: string | null;        // Vergi numarası
  taxOffice?: string | null;        // Vergi dairesi
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  tradeRegisterNo?: string | null;  // Ticaret sicil no
  mersisNo?: string | null;         // MERSİS no
  logoUrl?: string | null;          // Logo URL
  rowVersionBase64?: string | null; // Base64
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Update Company Settings Body
 * Backend: UpdateCompanySettingsCommand
 */
export interface UpdateCompanySettingsBody {
  id: number;
  rowVersionBase64?: string | null; // Required for optimistic concurrency
  nationalId?: string | null;
  postalCode?: string | null;
  title: string;
  taxNumber?: string | null;
  taxOffice?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  tradeRegisterNo?: string | null;
  mersisNo?: string | null;
  logoUrl?: string | null;
}
