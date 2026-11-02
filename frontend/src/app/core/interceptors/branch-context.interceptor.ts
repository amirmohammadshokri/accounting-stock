import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BranchContextService } from '../services/branch-context.service';
import { environment } from '../../../environments/environment';

export const branchContextInterceptor: HttpInterceptorFn = (request, next) => {
  const branch = inject(BranchContextService);
  if (!request.url.startsWith(`${environment.apiBaseUrl}/`) || request.url.includes('/auth/')) return next(request);
  const active = branch.active();
  if (!active) return next(request);
  let headers = request.headers.set('X-Branch-Id', String(active.id));
  let params = request.params;
  if (request.method === 'GET' && branch.allBranches()) {
    headers = headers.set('X-Branch-Scope', 'all');
    params = params.delete('branchId');
  }
  return next(request.clone({headers, params}));
};
