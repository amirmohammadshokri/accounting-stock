/**
 * Stock Movement Models (Stok Hareketleri)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.StockMovements.Queries.Dto.StockMovementDtos
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum StockMovementType {
  PurchaseIn = 1,       // Alış / Giriş
  SalesOut = 2,         // Satış / Çıkış
  AdjustmentIn = 3,     // Sayım fazlası
  AdjustmentOut = 4,    // Sayım eksiği
  SalesReturn = 5,      // Satış iadesi (Giriş)
  PurchaseReturn = 6,   // Alış iadesi (Çıkış)
  TransferOut = 7,      // Transfer çıkışı
  TransferIn = 8,       // Transfer girişi
  OpeningBalance = 9
}

export type StockMovementTypeStr =
  | 'PurchaseIn'
  | 'SalesOut'
  | 'AdjustmentIn'
  | 'AdjustmentOut'
  | 'SalesReturn'
  | 'PurchaseReturn'
  | 'TransferOut'
  | 'TransferIn'
  | 'OpeningBalance';

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Stock Movement DTO (Read)
 * Backend: StockMovementDto
 */
export interface StockMovementDto {
  id: number;
  branchId: number;
  warehouseId: number;
  warehouseCode: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  type: StockMovementType;
  quantity: string;                 // F3 - Money string
  transactionDateUtc: string;       // ISO-8601 UTC
  note?: string | null;
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

/**
 * Stock Movement List Item (Same as detail)
 */
export type StockMovementListItemDto = StockMovementDto;

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Stock Movements Query Parameters
 * Backend: ListStockMovementsQuery
 */
export interface ListStockMovementsQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                    // "transactionDateUtc:desc"
  branchId?: number | null;
  warehouseId?: number | null;
  itemId?: number | null;
  type?: StockMovementType | null;
  fromUtc?: string | null;          // ISO-8601 UTC
  toUtc?: string | null;            // ISO-8601 UTC
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Stock Movement Body
 * Backend: CreateStockMovementCommand
 * NOTE: BranchId is NOT sent — backend derives it from the current user's branch.
 */
export interface CreateStockMovementBody {
  warehouseId: number;
  itemId: number;
  type: StockMovementType;
  quantity: string;                 // Money string (dot separator!)
  transactionDateUtc: string;       // ISO-8601 UTC
  note?: string | null;
}

/**
 * Transfer Stock Body
 * Backend: TransferStockCommand
 */
export interface TransferStockBody {
  sourceWarehouseId: number;
  targetWarehouseId: number;
  itemId: number;
  quantity: string;                 // Money string (dot separator!)
  transactionDateUtc: string;       // ISO-8601 UTC
  description?: string | null;
}

/**
 * Transfer Stock Result
 * Backend: StockTransferDetailDto
 */
export interface StockTransferDetailDto {
  success: boolean;
  outMovementId: number;
  inMovementId: number;
  message: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Check if movement type is inbound (increases stock)
 */
export function isInboundMovement(type: StockMovementType): boolean {
  return [
    StockMovementType.PurchaseIn,
    StockMovementType.AdjustmentIn,
    StockMovementType.SalesReturn,
    StockMovementType.TransferIn,
    StockMovementType.OpeningBalance
  ].includes(type);
}

/**
 * Check if movement type is outbound (decreases stock)
 */
export function isOutboundMovement(type: StockMovementType): boolean {
  return [
    StockMovementType.SalesOut,
    StockMovementType.AdjustmentOut,
    StockMovementType.PurchaseReturn,
    StockMovementType.TransferOut
  ].includes(type);
}

/**
 * Get movement type display name (Turkish)
 */
export function getMovementTypeDisplayName(type: StockMovementType): string {
  const names: Record<StockMovementType, string> = {
    [StockMovementType.PurchaseIn]: 'خرید / ورود',
    [StockMovementType.SalesOut]: 'فروش / خروج',
    [StockMovementType.AdjustmentIn]: 'اضافه موجودی انبارگردانی',
    [StockMovementType.AdjustmentOut]: 'کسری موجودی انبارگردانی',
    [StockMovementType.SalesReturn]: 'برگشت از فروش',
    [StockMovementType.PurchaseReturn]: 'برگشت از خرید',
    [StockMovementType.TransferOut]: 'خروج انتقالی',
    [StockMovementType.TransferIn]: 'ورود انتقالی',
    [StockMovementType.OpeningBalance]: 'موجودی اول دوره'
  };
  return names[type] || 'نامشخص';
}
