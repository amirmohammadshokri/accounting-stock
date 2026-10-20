/**
 * Warehouse Models (Depolar)
 * 
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Warehouses.Dto.WarehouseDtos
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Warehouse DTO (Read)
 * Backend: WarehouseDto
 */
export interface WarehouseDto {
  id: number;
  branchId: number;
  code: string;
  name: string;
  isDefault: boolean;               // Varsayılan depo mu?
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

/**
 * Warehouse List Item DTO (Read)
 * Backend: WarehouseListItemDto — NOT the same as WarehouseDto, has no RowVersion.
 * Fetch full WarehouseDto via getById() before edit/delete.
 */
export interface WarehouseListItemDto {
  id: number;
  branchId: number;
  code: string;
  name: string;
  isDefault: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Warehouses Query Parameters
 * Backend: ListWarehousesQuery
 */
export interface ListWarehousesQuery {
  filters?: string;
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                    // "name:asc", "code:desc"
  branchId?: number | null;
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Warehouse Body
 * Backend: CreateWarehouseCommand
 */
export interface CreateWarehouseBody {
  branchId: number;
  code: string;
  name: string;
  isDefault: boolean;
}

/**
 * Update Warehouse Body
 * Backend: UpdateWarehouseCommand
 */
export interface UpdateWarehouseBody {
  id: number;
  rowVersion: string;               // Required for optimistic concurrency (backend: UpdateWarehouseCommand.RowVersion)
  branchId: number;
  code: string;
  name: string;
  isDefault: boolean;
}
