/**
 * Expense List Models (Masraf Listeleri)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.ExpenseLists.Dto.ExpenseListDtos
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ExpenseListStatus {
  Draft = 1,        // Taslak
  Reviewed = 2,     // İncelendi
  Posted = 3        // Faturaya aktarıldı
}

export type ExpenseListStatusStr = 'Draft' | 'Reviewed' | 'Posted';

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Expense Line DTO (Read)
 * Backend: ExpenseLineDto
 */
export interface ExpenseLineDto {
  id: number;
  expenseListId: number;
  dateUtc: string;                  // ISO-8601 UTC
  supplierId?: number | null;
  currency: string;
  amount: string;                   // F2 - Money string
  vatRate: number;
  category?: string | null;
  notes?: string | null;
}

/**
 * Expense List DTO (Read - Simple)
 * Backend: ExpenseListDto
 */
export interface ExpenseListDto {
  id: number;
  branchId: number;
  name: string;
  status: string;                   // "Draft" | "Reviewed" | "Posted"
  createdAtUtc: string;             // ISO-8601 UTC
}

/**
 * Expense List Detail DTO (Read - With Lines)
 * Backend: ExpenseListDetailDto
 */
export interface ExpenseListDetailDto {
  id: number;
  branchId: number;
  name: string;
  status: string;                   // "Draft" | "Reviewed" | "Posted"
  lines: ExpenseLineDto[];
  totalAmount: string;              // F2 - Money string
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
  rowVersion: string;               // Base64
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Expense Lists Query Parameters
 * Backend: ListExpenseListsQuery
 */
export interface ListExpenseListsQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                    // "createdAtUtc:desc", "name:asc"
  branchId?: number | null;
  status?: ExpenseListStatus | null;
  dateFromUtc?: string | null;      // ISO-8601 UTC
  dateToUtc?: string | null;        // ISO-8601 UTC
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Expense Line Body
 */
export interface CreateExpenseLineBody {
  id: 0;                            // Always 0 for new
  dateUtc: string;                  // ISO-8601 UTC
  supplierId?: number | null;
  currency: string;
  amount: string;                   // Money string (dot separator!)
  vatRate: number;
  category?: string | null;
  notes?: string | null;
}

/**
 * Update Expense Line Body
 */
export interface UpdateExpenseLineBody {
  id: number;                       // Existing line ID or 0 for new
  dateUtc: string;                  // ISO-8601 UTC
  supplierId?: number | null;
  currency: string;
  amount: string;                   // Money string (dot separator!)
  vatRate: number;
  category?: string | null;
  notes?: string | null;
}

/**
 * Create Expense List Body
 * Backend: CreateExpenseListCommand
 */
export interface CreateExpenseListBody {
  branchId: number;
  name: string;
  lines: CreateExpenseLineBody[];
}

/**
 * Update Expense List Body
 * Backend: UpdateExpenseListCommand
 */
export interface UpdateExpenseListBody {
  id: number;
  rowVersionBase64: string;         // Required for optimistic concurrency
  branchId: number;
  name: string;
  lines: UpdateExpenseLineBody[];
}

/**
 * Post Expense List to Bill Body
 * Backend: PostExpenseListToBillCommand
 */
export interface PostExpenseListToBillBody {
  expenseListId: number;
  supplierId: number;
  itemId: number;                   // Masraf kalemi (Item)
  currency: string;
  createPayment: boolean;           // Aynı zamanda ödeme oluştur mu?
  paymentAccountId?: number | null; // Ödeme yapılacak hesap
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Get expense list status display name (Turkish)
 */
export function getExpenseListStatusDisplayName(status: string): string {
  const names: Record<string, string> = {
    'Draft': 'پیش‌نویس',
    'Reviewed': 'بررسی شده',
    'Posted': 'فاکتور شده'
  };
  return names[status] || 'نامشخص';
}

/**
 * Get expense list status color
 */
export function getExpenseListStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Draft': '#9E9E9E',       // Gray
    'Reviewed': '#FF9800',    // Orange
    'Posted': '#4CAF50'       // Green
  };
  return colors[status] || '#9E9E9E';
}
