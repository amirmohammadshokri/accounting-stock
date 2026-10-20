import { HANDLE_ERROR_LOCALLY } from '../interceptors/http-problem-interceptor';
/**
 * Auth Service
 * Backend: AuthController
 * @see Accounting.Api.Controllers.AuthController
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  LoginBody,
  AuthResponse,
  CurrentUser,
  JwtClaims
} from '../models/auth.models';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiBaseUrl}/auth`;

  // Signals for reactive state
  private currentUserSignal = signal<CurrentUser | null>(this.loadUserFromStorage());
  
  // Public readonly signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => ['مدیر سامانه', 'Admin'].includes(this.currentUser()?.role ?? ''));

  constructor() {
    // Token varsa ama user yoksa, token'ı parse et
    const token = this.getToken();
    if (token && !this.currentUser()) {
      try {
        const claims = this.decodeToken(token);
        // Token geçerliyse user'ı oluştur
        if (claims && claims.exp * 1000 > Date.now()) {
          // User bilgisi localStorage'da yoksa claims'den oluştur
          this.loadUserFromToken(claims);
        } else {
          this.clearAuth();
        }
      } catch {
        this.clearAuth();
      }
    }
  }

  /**
   * POST /api/auth/login
   */
  login(body: LoginBody): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, body, {context:new HttpContext().set(HANDLE_ERROR_LOCALLY,true)}).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  /**
   * POST /api/auth/refresh
   * RefreshToken cookie'den otomatik gönderilir (HttpOnly)
   */
  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {}, {context:new HttpContext().set(HANDLE_ERROR_LOCALLY,true)}).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  /**
   * Logout - Token'ları temizle ve login'e yönlendir
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  /**
   * Get current access token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const claims = this.decodeToken(token);
      if (!claims || !claims.exp) return true;
      
      // Token'ın expire zamanı (saniye cinsinden)
      const expirationTime = claims.exp * 1000;
      const now = Date.now();
      
      return now >= expirationTime;
    } catch {
      return true;
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): JwtClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
      const decoded = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      
      return decoded as JwtClaims;
    } catch {
      return null;
    }
  }

  /**
   * Handle auth response - Store token and user
   */
  private handleAuthResponse(response: AuthResponse): void {
    // Store token
    localStorage.setItem(TOKEN_KEY, response.accessToken);

    // Parse token to get claims
    const claims = this.decodeToken(response.accessToken);
    
    // Create user object
    const user: CurrentUser = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: claims?.role ?? '',
      permissions: claims?.permission ?? [],
      branchId: claims?.branchId ? Number(claims.branchId) : undefined,
      isHeadquarters: claims?.isHeadquarters === 'true'
    };

    // Store user
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): CurrentUser | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as CurrentUser;
    } catch {
      return null;
    }
  }

  /**
   * Load user from token claims
   */
  private loadUserFromToken(claims: JwtClaims): void {
    const user: CurrentUser = {
      id: Number(claims.id),
      email: claims.email,
      firstName: '', // Token'da yok, login response'dan gelir
      lastName: '',  // Token'da yok, login response'dan gelir
      role: claims.role,
      permissions: claims.permission ?? [],
      branchId: claims.branchId ? Number(claims.branchId) : undefined,
      isHeadquarters: claims.isHeadquarters === 'true'
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  /**
   * Clear all auth data
   */
  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }
}
