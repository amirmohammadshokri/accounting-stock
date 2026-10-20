/**
 * Auth Interceptor
 * Adds JWT token to all HTTP requests (except auth endpoints)
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip token injection for auth endpoints
  if (req.url.includes('/auth/login') ||
      req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // Get token
  const token = authService.getToken();

  // If no token, proceed without Authorization header
  if (!token) {
    return next(req);
  }

  // Check if token is expired
  if (authService.isTokenExpired()) {
    // Try to refresh token
    return authService.refresh().pipe(
      switchMap(() => {
        // Token refreshed, get new token and retry request
        const newToken = authService.getToken();
        const clonedReq = newToken 
          ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
          : req;
        return next(clonedReq);
      }),
      catchError(error => {
        // Refresh failed, logout
        authService.logout();
        return throwError(() => error);
      })
    );
  }

  // Add token to request
  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedReq).pipe(
    catchError(error => {
      // If 401 Unauthorized, try to refresh
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return authService.refresh().pipe(
          switchMap(() => {
            const newToken = authService.getToken();
            const retryReq = newToken
              ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
              : req;
            return next(retryReq);
          }),
          catchError(refreshError => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
