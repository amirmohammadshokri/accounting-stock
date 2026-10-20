/**
 * Stock Models (Stoklar)
 * 
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Stocks.Queries.Dto.StockDtos
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Stock Detail DTO (Read)
 * Backend: StockDetailDto
 */
export interface StockDetailDto {
  id: number;
  branchId: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: string;                 // F3 - Money string (stok miktarı)
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

/**
 * Stock List Item DTO (Read)
 * Backend: StockListItemDto
 */
export interface StockListItemDto {
  id: number;
  branchId: number;
  warehouseId: number;
  warehouseCode: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: string;                 // F3 - Money string
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Stocks Query Parameters
 * Backend: ListStocksQuery
 */
export interface ListStocksQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                    // "itemName:asc", "quantity:desc"
  branchId?: number | null;
  warehouseId?: number | null;
  itemId?: number | null;
  search?: string | null;           // Item name or code search
}

// ============================================================================
// NOTE: Stocks are managed via StockMovements
// Direct create/update is not typically allowed
// ============================================================================
