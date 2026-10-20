/**
 * Cheques Service
 * Backend: ChequesController
 * @see Accounting.Api.Controllers.ChequesController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChequeDetailDto,
  ListChequesQuery,
  CreateChequeBody,
  UpdateChequeStatusBody
} from '../models/cheque.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class ChequesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/cheques`;

  list(query: ListChequesQuery = {}): Observable<PagedResult<ChequeDetailDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.status) params = params.set('status', query.status);
    if (query.type) params = params.set('type', query.type);
    if (query.direction) params = params.set('direction', query.direction);
    return this.http.get<PagedResult<ChequeDetailDto>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ChequeDetailDto> {
    return this.http.get<ChequeDetailDto>(`${this.baseUrl}/${id}`);
  }

  create(body: CreateChequeBody): Observable<number> {
    return this.http.post<number>(this.baseUrl, body);
  }

  updateStatus(id: number, body: UpdateChequeStatusBody): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/status`, body);
  }

  // Backend: DELETE body alan adı "rowVersion" — UpdateStatus'teki "rowVersionBase64"tan farklı
  // (bkz. RowVersionDto/ChequesController.Delete).
  delete(id: number, rowVersion: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      body: { rowVersion }
    });
  }
}
