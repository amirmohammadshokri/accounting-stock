/**
 * Categories Service
 * Backend: CategoriesController
 * @see Accounting.Api.Controllers.CategoriesController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoryListItemDto,
  ListCategoriesQuery,
  CreateCategoryBody,
  UpdateCategoryBody
} from '../models/category.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/categories`;

  /**
   * GET /api/categories
   */
  list(query: ListCategoriesQuery = {}): Observable<PagedResult<CategoryListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.search) params = params.set('search', query.search);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    return this.http.get<PagedResult<CategoryListItemDto>>(this.baseUrl, { params });
  }

  /**
   * POST /api/categories
   */
  create(body: CreateCategoryBody): Observable<CategoryListItemDto> {
    return this.http.post<CategoryListItemDto>(this.baseUrl, body);
  }

  /**
   * PUT /api/categories/{id}
   */
  update(id: number, body: UpdateCategoryBody): Observable<CategoryListItemDto> {
    return this.http.put<CategoryListItemDto>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/categories/{id}?rowVersion=...
   * Backend: DeleteCategoryCommand — DİKKAT: RowVersion body'de değil query string'de bekleniyor.
   */
  delete(id: number, rowVersion: string): Observable<boolean> {
    const params = new HttpParams().set('rowVersion', rowVersion);
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`, { params });
  }
}
