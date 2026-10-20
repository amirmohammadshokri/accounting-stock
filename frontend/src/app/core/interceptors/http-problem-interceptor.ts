import { LicenseService } from '../services/license.service';
import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { persianError, persianField } from '../utils/persian-errors';

export const HANDLE_ERROR_LOCALLY = new HttpContextToken<boolean>(() => false);

type ProblemDetails = {
  title?: string; status?: number; detail?: string; message?: string;
  errors?: Record<string, string[]>; traceId?: string;
};

export const httpProblemInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  const license = inject(LicenseService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.error?.code === 'license_expired') { license.markExpired(); return throwError(() => err); }
      if (req.context.get(HANDLE_ERROR_LOCALLY)) return throwError(() => err);
      const original = err.error && typeof err.error === 'object' && !(err.error instanceof Blob) ? err.error : {};
      const p: ProblemDetails = {
        ...original,
        title: persianError(original.title, err.status),
        message: persianError(original.message ?? original.detail, err.status),
        detail: original.detail ? persianError(original.detail, err.status) : undefined,
        errors: original.errors ? Object.fromEntries(Object.entries(original.errors as Record<string, string[]>).map(([key, values]) => [key, values.map(value => persianError(value, err.status))])) : undefined
      };
      const isProblem = original.title || original.errors || original.message || original.detail;

      if (isProblem) {
        snack.open(p.detail ?? p.message ?? p.title ?? 'خطای درخواست', 'بستن', { duration: 6000 });
        if (p.errors) {
          for (const [k, arr] of Object.entries(p.errors)) {
            (arr || []).forEach(m => snack.open(`${persianField(k)}: ${m}`, 'بستن', { duration: 6000 }));
          }
        }
        if (p.traceId) console.warn('TraceId:', p.traceId);
      } else {
        const msg = persianError(undefined, err.status);
        snack.open(msg, 'بستن', { duration: 6000 });
      }

      return throwError(() => new HttpErrorResponse({ error: p, headers: err.headers, status: err.status, statusText: err.statusText, url: err.url ?? undefined }));
    })
  );
};
