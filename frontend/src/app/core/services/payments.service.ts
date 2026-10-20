/**
 * Payments Service
 * Backend: PaymentsController
 * @see Accounting.Api.Controllers.PaymentsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentDetailDto,
  PaymentListItemDto,
  ListPaymentsQuery,
  CreatePaymentBody,
  UpdatePaymentBody
} from '../models/payment.models';
import { PagedResult } from '../models/paged-result';

export interface CreatePaymentResult {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/payments`;

  /**
   * POST /api/payments
   */
  create(body: CreatePaymentBody): Observable<CreatePaymentResult> {
    return this.http.post<CreatePaymentResult>(this.baseUrl, body);
  }

  /**
   * GET /api/payments/{id}
   */
  getById(id: number): Observable<PaymentDetailDto> {
    return this.http.get<PaymentDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/payments
   */
  list(query: ListPaymentsQuery = {}): Observable<PagedResult<PaymentListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.sort) params = params.set('sort', query.sort);
    if (query.accountId != null) params = params.set('accountId', query.accountId.toString());
    if (query.contactId != null) params = params.set('contactId', query.contactId.toString());
    if (query.direction != null) params = params.set('direction', query.direction.toString());
    if (query.dateFromUtc) params = params.set('dateFromUtc', query.dateFromUtc);
    if (query.dateToUtc) params = params.set('dateToUtc', query.dateToUtc);
    if (query.currency) params = params.set('currency', query.currency);
    return this.http.get<PagedResult<PaymentListItemDto>>(this.baseUrl, { params });
  }

  /**
   * PUT /api/payments/{id}
   */
  update(id: number, body: UpdatePaymentBody): Observable<PaymentDetailDto> {
    return this.http.put<PaymentDetailDto>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/payments/{id}
   */
  delete(id: number, rowVersion: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      body: { rowVersion }
    });
  }
}
