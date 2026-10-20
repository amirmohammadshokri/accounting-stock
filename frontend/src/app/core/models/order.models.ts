/**
 * Order Models (Siparişler/Teklifler)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Orders.Dto.OrderDto
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum OrderStatus {
  Draft = 1,        // Taslak / Teklif aşaması
  Approved = 2,     // Onaylandı / Sipariş kesinleşti
  Invoiced = 3,     // Faturalandı / Tamamlandı
  Cancelled = 9     // İptal edildi
}

/**
 * Order Type — backend reuses InvoiceType (Accounting.Domain.Enums.InvoiceType)
 * for Order.Type ("Reusing InvoiceType is fine as per plan" per entity comment).
 */
export enum OrderType {
  Sales = 1,
  Purchase = 2,
  SalesReturn = 3,
  PurchaseReturn = 4
}

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Order Line DTO (Read)
 * Backend: OrderLineDto
 */
export interface OrderLineDto {
  id: number;
  itemId?: number | null;
  itemName?: string | null;
  description: string;
  quantity: string;                 // F3 - Money string
  unitPrice: string;                // F4 - Money string
  vatRate: number;
  discountRate?: string;
  withholdingRate?: number;
  total: string;                    // F2 - Money string
}

/**
 * Order Detail DTO (Read)
 * Backend: OrderDetailDto
 */
export interface OrderDetailDto {
  id: number;
  branchId: number;
  orderNumber: string;
  contactId: number;
  contactName: string;
  dateUtc: string;                  // ISO-8601 UTC
  type: OrderType;
  status: OrderStatus;
  totalNet: string;                 // F2 - Money string
  totalVat: string;                 // F2 - Money string
  totalGross: string;               // F2 - Money string
  currency: string;
  description?: string | null;
  lines: OrderLineDto[];
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;
}

/**
 * Order List Item DTO (Read)
 * Backend: OrderListItemDto — NOT the same as OrderDetailDto, has no Lines/RowVersion.
 * Fetch OrderDetailDto via getById() before edit.
 */
export interface OrderListItemDto {
  id: number;
  branchId: number;
  orderNumber: string;
  contactId: number;
  contactName: string;
  dateUtc: string;                  // ISO-8601 UTC
  type: OrderType;
  status: OrderStatus;
  totalNet: string;                 // F2 - Money string
  totalVat: string;                 // F2 - Money string
  totalGross: string;               // F2 - Money string
  currency: string;
  description?: string | null;
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Orders Query Parameters
 * Backend: ListOrdersQuery — no Sort, no date-range filters, page field is `Page`.
 */
export interface ListOrdersQuery {
  filters?: string;
  page?: number;
  pageSize?: number;
  branchId?: number | null;
  contactId?: number | null;
  status?: OrderStatus | null;
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Order Line Body
 * Backend: CreateOrderLineDto — no Id (backend never needs one for new lines).
 */
export interface CreateOrderLineBody {
  itemId?: number | null;
  description: string;
  quantity: string;                 // Money string (dot separator!)
  unitPrice: string;                // Money string (dot separator!)
  vatRate: number;
  discountRate?: string;
  withholdingRate?: number;
}

/**
 * Update Order Line Body
 * Backend: UpdateOrderLineDto — id is nullable: null = new line, otherwise existing line id.
 */
export interface UpdateOrderLineBody {
  id: number | null;
  itemId?: number | null;
  description: string;
  quantity: string;                 // Money string (dot separator!)
  unitPrice: string;                // Money string (dot separator!)
  vatRate: number;
  discountRate?: string;
  withholdingRate?: number;
}

/**
 * Create Order Body
 * Backend: CreateOrderCommand — NO branchId (derived from current user), NO orderNumber
 * (auto-generated server-side, e.g. "SO-2026-0001"), NO status (always starts Draft).
 */
export interface CreateOrderBody {
  contactId: number;
  dateUtc: string;                  // ISO-8601 UTC
  type: OrderType;
  currency: string;
  description?: string | null;
  lines: CreateOrderLineBody[];
}

/**
 * Update Order Body
 * Backend: UpdateOrderCommand — only Draft orders are updatable; NO branchId, NO
 * orderNumber, NO status (status changes go through Approve/Cancel), NO type/currency
 * (immutable after creation).
 */
export interface UpdateOrderBody {
  id: number;
  rowVersion: string;               // Base64 — field name is RowVersion, not rowVersionBase64
  contactId: number;
  dateUtc: string;                  // ISO-8601 UTC
  description?: string | null;
  lines: UpdateOrderLineBody[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Get order status display name (Turkish)
 */
export function getOrderStatusDisplayName(status: OrderStatus): string {
  const names: Record<OrderStatus, string> = {
    [OrderStatus.Draft]: 'پیش‌نویس',
    [OrderStatus.Approved]: 'تأیید شده',
    [OrderStatus.Invoiced]: 'فاکتور شده',
    [OrderStatus.Cancelled]: 'لغو'
  };
  return names[status] || 'نامشخص';
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.Draft]: '#9E9E9E',       // Gray
    [OrderStatus.Approved]: '#2196F3',    // Blue
    [OrderStatus.Invoiced]: '#4CAF50',    // Green
    [OrderStatus.Cancelled]: '#F44336'    // Red
  };
  return colors[status] || '#9E9E9E';
}

/**
 * Get order type display name (Turkish)
 */
export function getOrderTypeDisplayName(type: OrderType): string {
  const names: Record<OrderType, string> = {
    [OrderType.Sales]: 'فروش',
    [OrderType.Purchase]: 'خرید',
    [OrderType.SalesReturn]: 'برگشت از فروش',
    [OrderType.PurchaseReturn]: 'برگشت از خرید'
  };
  return names[type] || 'نامشخص';
}
