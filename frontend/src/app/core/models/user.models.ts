/**
 * User Models (Kullanıcılar)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Users.Queries.Dto.UserDto
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * User List Item DTO (Read)
 * Backend: UserListItemDto
 */
export interface UserListItemDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  branchId?: number | null;
  branchName?: string | null;
  isActive: boolean;
  createdAtUtc: string;             // ISO-8601 UTC
}

/**
 * User Detail DTO (Read)
 * Backend: UserDetailDto
 */
export interface UserDetailDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  branchId?: number | null;
  branchName?: string | null;
  isActive: boolean;
  roles: string[];                  // Role names
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;     // ISO-8601 UTC
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Users Query Parameters
 * Backend: ListUsersQuery
 */
export interface ListUsersQuery {
  filters?: string;
  page?: number;
  pageSize?: number;
  search?: string | null;           // Name or email search
  isActive?: boolean | null;
  branchId?: number | null;
  roleId?: number | null;
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create User Body
 * Backend: CreateUserCommand
 */
export interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;                 // Plain text (will be hashed by backend)
  branchId?: number | null;
  isActive: boolean;
  roleIds: number[];                // Role IDs to assign
}

/**
 * Update User Body
 * Backend: UpdateUserCommand
 */
export interface UpdateUserBody {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  branchId?: number | null;
  isActive: boolean;
  roleIds: number[];                // Role IDs to assign
}

/**
 * Change Password Body (admin resets a user's password — no current-password check)
 * Backend: ChangeUserPasswordCommand via POST /api/users/{id}/change-password
 */
export interface ChangePasswordBody {
  newPassword: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Get user full name
 */
export function getUserFullName(user: UserListItemDto | UserDetailDto): string {
  return `${user.firstName} ${user.lastName}`;
}

/**
 * Get user status display name
 */
export function getUserStatusDisplayName(isActive: boolean): string {
  return isActive ? 'فعال' : 'غیرفعال';
}
