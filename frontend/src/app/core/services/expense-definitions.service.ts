/**
 * Expense Definitions Service
 * Backend: ExpenseDefinitionsController
 * @see Accounting.Api.Controllers.ExpenseDefinitionsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExpenseDefinitionListItemDto,
  ExpenseDefinitionDetailDto,
  ListExpenseDefinitionsQuery,
  CreateExpenseDefinitionBody,
  UpdateExpenseDefinitionBody
} from '../models/expense-definition.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class ExpenseDefinitionsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/expense-definitions`;

  /**
   * POST /api/expense-definitions
   */
  create(body: CreateExpenseDefinitionBody): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, body);
  }

  /**
   * GET /api/expense-definitions/{id}
   */
  getById(id: number): Observable<ExpenseDefinitionDetailDto> {
    return this.http.get<ExpenseDefinitionDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/expense-definitions
   */
  list(query: ListExpenseDefinitionsQuery = {}): Observable<PagedResult<ExpenseDefinitionListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.search) params = params.set('search', query.search);
    if (query.isActive != null) params = params.set('isActive', query.isActive.toString());
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<PagedResult<ExpenseDefinitionListItemDto>>(this.baseUrl, { params });
  }

  /**
   * PUT /api/expense-definitions/{id}
   */
  update(id: number, body: UpdateExpenseDefinitionBody): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/expense-definitions/{id}
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
