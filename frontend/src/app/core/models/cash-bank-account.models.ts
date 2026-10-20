/**
 * Cash/Bank Account Models (Kasa/Banka Hesapları)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.CashBankAccounts.Queries.Dto.CashBankAccountDtos
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum CashBankAccountType {
  Cash = 1,
  Bank = 2
}

export type CashBankAccountTypeStr = 'Cash' | 'Bank';

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Cash/Bank Account List Item DTO (Read)
 * Backend: CashBankAccountListItemDto
 */
export interface CashBankAccountListItemDto {
  id: number;
  branchId: number;
  code: string;
  type: string;                     // "Cash" | "Bank"
  name: string;
  iban?: string | null;
  currency: string;
  balance: string;                  // F2 - Money string
  createdAtUtc: string;             // ISO-8601 UTC
}

/**
 * Cash/Bank Account Detail DTO (Read)
 * Backend: CashBankAccountDetailDto
 */
export interface CashBankAccountDetailDto {
  id: number;
  branchId: number;
  code: string;
  type: string;                     // "Cash" | "Bank"
  name: string;
  iban?: string | null;
  currency: string;
  balance: string;                  // F2 - Money string
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Cash/Bank Accounts Query Parameters
 * Backend: ListCashBankAccountsQuery
 */
export interface ListCashBankAccountsQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                    // "name:asc", "code:desc"
  type?: CashBankAccountType | null;
  branchId?: number | null;
  search?: string | null;
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Cash/Bank Account Body
 * Backend: CreateCashBankAccountCommand — DİKKAT: Code YOK (backend "CBA-{branchId}-{seq}" olarak
 * otomatik üretiyor), Currency YOK (entity'de her zaman "TRY" default, API'den değiştirilemiyor).
 */
export interface CreateCashBankAccountBody {
  branchId: number;
  type: CashBankAccountType;
  name: string;
  iban?: string | null;
}

/**
 * Update Cash/Bank Account Body
 * Backend: UpdateCashBankAccountCommand — DİKKAT: BranchId ve Code güncellenemiyor (immutable),
 * RowVersion alanı "rowVersion" (rowVersionBase64 DEĞİL).
 */
export interface UpdateCashBankAccountBody {
  id: number;
  rowVersion: string;               // Required for optimistic concurrency (backend: UpdateCashBankAccountCommand.RowVersion)
  type: CashBankAccountType;
  name: string;
  iban?: string | null;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Account type to string conversion
 */
export function accountTypeToString(type: number): CashBankAccountTypeStr {
  return type === CashBankAccountType.Bank ? 'Bank' : 'Cash';
}

/**
 * Account type to number conversion
 */
export function accountTypeToNumber(type: CashBankAccountTypeStr): CashBankAccountType {
  return type === 'Bank' ? CashBankAccountType.Bank : CashBankAccountType.Cash;
}

/**
 * Get account type display name (Turkish)
 */
export function getAccountTypeDisplayName(type: string | number): string {
  const typeStr = typeof type === 'number' ? accountTypeToString(type) : type;
  return typeStr === 'Bank' ? 'بانک' : 'صندوق';
}
