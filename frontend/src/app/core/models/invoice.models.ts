/**
 * Invoice Models
 *
 * Backend ile 1:1 senkronize - 2026-01-18
 * @see Accounting.Application.Invoices.Queries.Dto.InvoiceDtos
 * @see Accounting.Application.Invoices.Commands.Create.CreateInvoiceCommand
 * @see Accounting.Application.Invoices.Commands.Update.UpdateInvoiceCommand
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum InvoiceType {
  Sales = 1,
  Purchase = 2,
  SalesReturn = 3,
  PurchaseReturn = 4
}

export type InvoiceTypeStr = 'Sales' | 'Purchase' | 'SalesReturn' | 'PurchaseReturn';

export enum DocumentType {
  Invoice = 1,
  RetailReceipt = 2,
  ExpenseNote = 3
}

export const DocumentTypeNames: Record<DocumentType, string> = {
  [DocumentType.Invoice]: 'فاکتور',
  [DocumentType.RetailReceipt]: 'رسید فروش خرده‌فروشی',
  [DocumentType.ExpenseNote]: 'سند هزینه'
};

export enum InvoiceTypeFilter {
  Any = 0,
  Sales = 1,
  Purchase = 2,
  SalesReturn = 3,
  PurchaseReturn = 4
}

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Invoice Line DTO (Read)
 * Backend: InvoiceLineDto
 */
export interface InvoiceLineDto {
  id: number;
  itemId: number | null;
  expenseDefinitionId: number | null;
  itemCode: string;
  itemName: string;
  unit: string;
  qty: string;                    // F3 - Money string (QuantityJsonConverter)
  unitPrice: string;              // F4 - Money string (UnitPriceJsonConverter)
  vatRate: number;                // Percentage (0-100)
  discountRate: string;           // F2 - Money string (PercentJsonConverter)
  discountAmount: string;         // F2 - Money string (AmountJsonConverter)
  net: string;                    // F2 - Money string
  vat: string;                    // F2 - Money string
  withholdingRate: number;        // Percentage (0-100)
  withholdingAmount: string;      // F2 - Money string
  gross: string;                  // F2 - Money string
  grandTotal: string;             // F2 - Money string (Gross - Withholding)
}

/**
 * Invoice Detail DTO (Read)
 * Backend: InvoiceDetailDto
 */
export interface InvoiceDetailDto {
  id: number;
  contactId: number;
  contactCode: string;
  contactName: string;
  dateUtc: string;                // ISO-8601 UTC (DateTime)
  invoiceNumber: string;
  currency: string;               // "TRY", "USD", "EUR"

  // Totals
  totalLineGross: string;         // F2 - Sum of line gross amounts
  totalDiscount: string;          // F2 - Sum of discounts
  totalNet: string;               // F2 - Sum of net amounts
  totalVat: string;               // F2 - Sum of VAT
  totalWithholding: string;       // F2 - Sum of withholding
  totalGross: string;             // F2 - Net + VAT
  balance: string;                // F2 - Remaining unpaid amount

  // Lines
  lines: InvoiceLineDto[];

  // Type & Branch
  documentType?: number;
  type: number;                   // InvoiceType enum (1-4)
  branchId: number;
  branchCode: string;
  branchName: string;

  // Optional fields
  waybillNumber: string | null;
  waybillDateUtc: string | null;      // ISO-8601 UTC
  notes?: string | null;
  paymentDueDateUtc: string | null;   // ISO-8601 UTC

  // Audit
  rowVersion: string;             // Base64
  createdAtUtc: string;           // ISO-8601 UTC
  updatedAtUtc: string | null;    // ISO-8601 UTC
}

/**
 * Invoice List Item DTO (Read)
 * Backend: InvoiceListItemDto
 */
export interface InvoiceListItemDto {
  id: number;
  contactId: number;
  contactCode: string;
  contactName: string;
  invoiceNumber: string;
  type: number;                   // InvoiceType enum (1-4)
  dateUtc: string;                // ISO-8601 UTC
  currency: string;
  totalNet: string;               // F2
  totalVat: string;               // F2
  totalGross: string;             // F2
  balance: string;                // F2 - Kalan bakiye
  branchId: number;
  branchCode: string;
  branchName: string;
  createdAtUtc: string;           // ISO-8601 UTC
  updatedAtUtc: string | null;    // ISO-8601 UTC
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Invoices Query Parameters
 * Backend: ListInvoicesQuery
 */
export interface ListInvoicesQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                      // "dateUtc:desc", "totalNet:asc"
  branchId?: number | null;
  contactId?: number | null;
  type?: number;                      // InvoiceTypeFilter (0-4)
  dateFromUtc?: string | null;        // ISO-8601 UTC
  dateToUtc?: string | null;          // ISO-8601 UTC
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Invoice Line Body
 * Backend: CreateInvoiceLineDto
 */
export interface CreateInvoiceLineDto {
  itemId: number | null;
  expenseDefinitionId: number | null;
  qty: string;                        // F3 - Money string
  unitPrice: string;                  // F4 - Money string
  vatRate: number;                    // 0-100
  discountRate: string | null;        // F2 - Money string (optional)
  withholdingRate: number | null;     // 0-100 (optional)
}

/**
 * Create Invoice Command Body
 * Backend: CreateInvoiceCommand
 */
export interface CreateInvoiceCommand {
  contactId: number;
  dateUtc: string;                    // ISO-8601 UTC
  currency: string;                   // "TRY", "USD", "EUR"
  lines: CreateInvoiceLineDto[];
  type: number;                       // InvoiceType enum (1-4)
  documentType: number | null;        // DocumentType enum (1=Invoice, 2=RetailReceipt, 3=ExpenseNote)
  waybillNumber: string | null;
  waybillDateUtc: string | null;      // ISO-8601 UTC
  notes?: string | null;
  paymentDueDateUtc: string | null;   // ISO-8601 UTC
}

/**
 * Create Invoice Result
 * Backend: CreateInvoiceResult
 */
export interface CreateInvoiceResult {
  id: number;
  totalNet: string;                   // F2
  totalVat: string;                   // F2
  totalGross: string;                 // F2
  roundingPolicy: string;
}

/**
 * Update Invoice Line Body
 * Backend: UpdateInvoiceLineDto
 */
export interface UpdateInvoiceLineDto {
  id: number;                         // 0 for new lines, >0 for existing
  itemId: number | null;
  expenseDefinitionId: number | null;
  qty: string;                        // F3 - Money string
  unitPrice: string;                  // F4 - Money string
  vatRate: number;                    // 0-100
  discountRate: string | null;        // F2 - Money string (optional)
  withholdingRate: number | null;     // 0-100 (optional)
}

/**
 * Update Invoice Command Body
 * Backend: UpdateInvoiceCommand
 */
export interface UpdateInvoiceCommand {
  id: number;
  rowVersionBase64: string;           // Base64 string
  dateUtc: string;                    // ISO-8601 UTC
  currency: string;                   // "TRY", "USD", "EUR"
  contactId: number;
  type: number;                       // InvoiceType enum (1-4)
  documentType: number | null;        // DocumentType enum (1=Invoice, 2=RetailReceipt, 3=ExpenseNote)
  waybillNumber: string | null;
  waybillDateUtc: string | null;      // ISO-8601 UTC
  notes?: string | null;
  paymentDueDateUtc: string | null;   // ISO-8601 UTC
  lines: UpdateInvoiceLineDto[];
}

/**
 * Delete Invoice Body
 * Backend: SoftDeleteInvoiceCommand uses RowVersionDto
 */
export interface DeleteInvoiceBody {
  rowVersion: string;                 // Base64 string
}

// ============================================================================
// HELPER TYPES (Frontend specific - not from backend)
// ============================================================================

/**
 * Invoice Type Display Names (for UI)
 */
export const InvoiceTypeNames: Record<InvoiceType, string> = {
  [InvoiceType.Sales]: 'فروش',
  [InvoiceType.Purchase]: 'خرید',
  [InvoiceType.SalesReturn]: 'برگشت از فروش',
  [InvoiceType.PurchaseReturn]: 'برگشت از خرید'
};

/**
 * Invoice Type Filter Display Names (for UI)
 */
export const InvoiceTypeFilterNames: Record<InvoiceTypeFilter, string> = {
  [InvoiceTypeFilter.Any]: 'همه',
  [InvoiceTypeFilter.Sales]: 'فروش',
  [InvoiceTypeFilter.Purchase]: 'خرید',
  [InvoiceTypeFilter.SalesReturn]: 'برگشت از فروش',
  [InvoiceTypeFilter.PurchaseReturn]: 'برگشت از خرید'
};
