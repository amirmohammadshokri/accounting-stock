/**
 * Authentication Models
 * Backend: Accounting.Api.Controllers.AuthController
 * Backend: Accounting.Api.Contracts.Authentication.AuthResponse
 */

// ========== Request Bodies ==========

export interface LoginBody {
  email: string;
  password: string;
}

// ========== Response DTOs ==========

/**
 * Backend: AuthResponse.cs
 * RefreshToken cookie'de geldiği için response'ta yok
 */
export interface AuthResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  accessToken: string;
}

/**
 * Decoded JWT Claims
 */
export interface JwtClaims {
  id: string;
  email: string;
  role: string;
  permission: string[];
  branchId?: string;
  isHeadquarters?: string;
  exp: number;
  iat: number;
}

/**
 * Current User State
 */
export interface CurrentUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  branchId?: number;
  isHeadquarters: boolean;
}
