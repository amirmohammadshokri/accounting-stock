/**
 * Expense Definition Models (Masraf Tanımları)
 * 
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.ExpenseDefinitions.Queries.Dto.ExpenseDefinitionDtos
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Expense Definition List Item DTO (Read)
 * Backend: ExpenseDefinitionListItemDto
 */
export interface ExpenseDefinitionListItemDto {
  id: number;
  code: string;
  name: string;
  defaultVatRate: number;           // Varsayılan KDV oranı (0-100)
  isActive: boolean;
  createdAtUtc: string;             // ISO-8601 UTC
}

/**
 * Expense Definition Detail DTO (Read)
 * Backend: ExpenseDefinitionDetailDto
 */
export interface ExpenseDefinitionDetailDto {
  id: number;
  code: string;
  name: string;
  defaultVatRate: number;
  isActive: boolean;
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Expense Definitions Query Parameters
 * Backend: ListExpenseDefinitionsQuery
 */
export interface ListExpenseDefinitionsQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                    // "name:asc", "code:desc"
  search?: string | null;           // Name or code search
  isActive?: boolean | null;
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Expense Definition Body
 * Backend: CreateExpenseDefinitionCommand
 */
export interface CreateExpenseDefinitionBody {
  code: string;
  name: string;
  defaultVatRate: number;
  isActive: boolean;
}

/**
 * Update Expense Definition Body
 * Backend: UpdateExpenseDefinitionCommand
 */
export interface UpdateExpenseDefinitionBody {
  id: number;
  rowVersionBase64: string;         // Required for optimistic concurrency
  code: string;
  name: string;
  defaultVatRate: number;
  isActive: boolean;
}
