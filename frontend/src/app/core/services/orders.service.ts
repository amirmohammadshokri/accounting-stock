/**
 * Orders Service
 * Backend: OrdersController
 * @see Accounting.Api.Controllers.OrdersController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OrderDetailDto,
  OrderListItemDto,
  ListOrdersQuery,
  CreateOrderBody,
  UpdateOrderBody
} from '../models/order.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/orders`;

  /**
   * POST /api/orders
   */
  create(body: CreateOrderBody): Observable<OrderDetailDto> {
    return this.http.post<OrderDetailDto>(this.baseUrl, body);
  }

  /**
   * GET /api/orders/{id}
   */
  getById(id: number): Observable<OrderDetailDto> {
    return this.http.get<OrderDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/orders
   */
  list(query: ListOrdersQuery = {}): Observable<PagedResult<OrderListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.branchId != null) params = params.set('branchId', query.branchId.toString());
    if (query.contactId != null) params = params.set('contactId', query.contactId.toString());
    if (query.status != null) params = params.set('status', query.status.toString());
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    return this.http.get<PagedResult<OrderListItemDto>>(this.baseUrl, { params });
  }

  /**
   * PUT /api/orders/{id}
   */
  update(id: number, body: UpdateOrderBody): Observable<OrderDetailDto> {
    return this.http.put<OrderDetailDto>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/orders/{id}
   */
  delete(id: number, rowVersion: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`, {
      params: { rowVersion }
    });
  }

  /**
   * PUT /api/orders/{id}/approve
   */
  approve(id: number, rowVersion: string): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/${id}/approve`, null, {
      params: { rowVersion }
    });
  }

  /**
   * PUT /api/orders/{id}/cancel
   */
  cancel(id: number, rowVersion: string): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/${id}/cancel`, null, {
      params: { rowVersion }
    });
  }

  /**
   * POST /api/orders/{id}/create-invoice
   */
  createInvoice(id: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/${id}/create-invoice`, null);
  }

  /**
   * GET /api/orders/export
   */
  export(query: ListOrdersQuery = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.branchId != null) params = params.set('branchId', query.branchId.toString());
    if (query.contactId != null) params = params.set('contactId', query.contactId.toString());
    if (query.status != null) params = params.set('status', query.status.toString());
    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob' });
  }
}
