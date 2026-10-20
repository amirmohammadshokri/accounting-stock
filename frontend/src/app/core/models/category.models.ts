/**
 * Category Models (Kategoriler)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Categories.Queries.CategoryDto
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Category List Item DTO (Read)
 * Backend: CategoryListItemDto — DİKKAT: backend'de ayrı bir GetById endpoint'i YOK,
 * bu yüzden RowVersion (edit/delete için gerekli) doğrudan liste DTO'suna eklendi.
 */
export interface CategoryListItemDto {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;            // Hex color code (örn: "#FF5733")
  rowVersion: string;               // Base64
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Categories Query Parameters
 * Backend: ListCategoriesQuery(string? Search, int Page, int PageSize) — DİKKAT: sayfa
 * parametresinin adı "page" (diğer modüllerdeki "pageNumber" DEĞİL), sort desteklenmiyor.
 */
export interface ListCategoriesQuery {
  filters?: string;
  page?: number;
  pageSize?: number;
  search?: string | null;
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Category Body
 * Backend: CreateCategoryCommand
 */
export interface CreateCategoryBody {
  name: string;
  description?: string | null;
  color?: string | null;
}

/**
 * Update Category Body
 * Backend: UpdateCategoryCommand — RowVersion alanı "rowVersion" (rowVersionBase64 DEĞİL).
 */
export interface UpdateCategoryBody {
  id: number;
  rowVersion: string;
  name: string;
  description?: string | null;
  color?: string | null;
}
