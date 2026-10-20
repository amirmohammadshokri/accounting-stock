/**
 * Invoices Service
 * Backend controller ile 1:1 senkronize - 2026-01-18
 * @see Accounting.Api.Controllers.InvoicesController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result';
import {
  InvoiceDetailDto,
  InvoiceListItemDto,
  ListInvoicesQuery,
  CreateInvoiceCommand,
  CreateInvoiceResult,
  UpdateInvoiceCommand,
  DeleteInvoiceBody
} from '../models/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/invoices`;

  /**
   * GET /api/invoices
   * List invoices with filters
   */
  list(query: ListInvoicesQuery): Observable<PagedResult<InvoiceListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);

    // Add all query parameters
    if (query.pageNumber !== undefined) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize !== undefined) params = params.set('pageSize', query.pageSize.toString());
    if (query.sort) params = params.set('sort', query.sort);
    if (query.branchId !== undefined && query.branchId !== null) params = params.set('branchId', query.branchId.toString());
    if (query.contactId !== undefined && query.contactId !== null) params = params.set('contactId', query.contactId.toString());
    if (query.type !== undefined) params = params.set('type', query.type.toString());
    if (query.dateFromUtc) params = params.set('dateFromUtc', query.dateFromUtc);
    if (query.dateToUtc) params = params.set('dateToUtc', query.dateToUtc);

    return this.http.get<PagedResult<InvoiceListItemDto>>(this.baseUrl, { params });
  }

  /**
   * GET /api/invoices/{id}
   * Get invoice by شناسه
   */
  getById(id: number): Observable<InvoiceDetailDto> {
    return this.http.get<InvoiceDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * POST /api/invoices
   * Create new invoice
   */
  create(command: CreateInvoiceCommand): Observable<CreateInvoiceResult> {
    return this.http.post<CreateInvoiceResult>(this.baseUrl, command);
  }

  /**
   * PUT /api/invoices/{id}
   * Update existing invoice
   */
  update(id: number, command: UpdateInvoiceCommand): Observable<InvoiceDetailDto> {
    // Backend controller checks: if (id != body.Id) return BadRequest();
    // So we ensure command.id matches the route parameter
    if (command.id !== id) {
      throw new Error(`شناسه فاکتور یکسان نیست: مسیر=${id}، درخواست=${command.id}`);
    }
    return this.http.put<InvoiceDetailDto>(`${this.baseUrl}/${id}`, command);
  }

  /**
   * DELETE /api/invoices/{id}
   * Soft delete invoice
   */
  delete(id: number, body: DeleteInvoiceBody): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { body });
  }

  /**
   * GET /api/invoices/export
   * Export invoices to Excel
   */
  export(query: Omit<ListInvoicesQuery, 'pageNumber' | 'pageSize' | 'sort'>): Observable<Blob> {
    let params = new HttpParams();

    // Add filter parameters (no pagination)
    if (query.branchId !== undefined && query.branchId !== null) params = params.set('branchId', query.branchId.toString());
    if (query.contactId !== undefined && query.contactId !== null) params = params.set('contactId', query.contactId.toString());
    if (query.type !== undefined) params = params.set('type', query.type.toString());
    if (query.dateFromUtc) params = params.set('dateFromUtc', query.dateFromUtc);
    if (query.dateToUtc) params = params.set('dateToUtc', query.dateToUtc);

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
