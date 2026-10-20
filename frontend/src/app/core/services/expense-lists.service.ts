/**
 * Expense Lists Service
 * Backend: ExpenseListsController
 * @see Accounting.Api.Controllers.ExpenseListsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExpenseListDto,
  ExpenseListDetailDto,
  ListExpenseListsQuery,
  CreateExpenseListBody,
  UpdateExpenseListBody,
  PostExpenseListToBillBody
} from '../models/expense-list.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class ExpenseListsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/expense-lists`;

  /**
   * POST /api/expense-lists
   */
  create(body: CreateExpenseListBody): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, body);
  }

  /**
   * GET /api/expense-lists/{id}
   */
  getById(id: number): Observable<ExpenseListDetailDto> {
    return this.http.get<ExpenseListDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/expense-lists
   */
  list(query: ListExpenseListsQuery = {}): Observable<PagedResult<ExpenseListDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.branchId != null) params = params.set('branchId', query.branchId.toString());
    if (query.status != null) params = params.set('status', query.status.toString());
    if (query.dateFromUtc) params = params.set('dateFromUtc', query.dateFromUtc);
    if (query.dateToUtc) params = params.set('dateToUtc', query.dateToUtc);
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<PagedResult<ExpenseListDto>>(this.baseUrl, { params });
  }

  /**
   * PUT /api/expense-lists/{id}
   */
  update(id: number, body: UpdateExpenseListBody): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/expense-lists/{id}
   */
  delete(id: number, rowVersionBase64: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      body: { id, rowVersionBase64 }
    });
  }

  /**
   * POST /api/expense-lists/{id}/review
   */
  review(id: number, rowVersionBase64: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/review`, { rowVersionBase64 });
  }

  /**
   * POST /api/expense-lists/{id}/post-to-bill
   */
  postToBill(id: number, body: PostExpenseListToBillBody): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/${id}/post-to-bill`, body);
  }
}
