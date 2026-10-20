/**
 * Items Service
 * Backend: ItemsController
 * @see Accounting.Api.Controllers.ItemsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ItemDetailDto,
  ItemListItemDto,
  ListItemsQuery,
  CreateItemBody,
  UpdateItemBody
} from '../models/item.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class ItemsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/items`;

  /**
   * POST /api/items
   */
  create(body: CreateItemBody): Observable<ItemDetailDto> {
    return this.http.post<ItemDetailDto>(this.baseUrl, body);
  }

  /**
   * GET /api/items/{id}
   */
  getById(id: number): Observable<ItemDetailDto> {
    return this.http.get<ItemDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/items
   */
  list(query: ListItemsQuery = {}): Observable<PagedResult<ItemListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.search) params = params.set('search', query.search);
    if (query.categoryId != null) params = params.set('categoryId', query.categoryId.toString());
    if (query.unitId != null) params = params.set('unitId', String(query.unitId));
    if (query.vatRate != null) params = params.set('vatRate', query.vatRate.toString());
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<PagedResult<ItemListItemDto>>(this.baseUrl, { params });
  }

  /**
   * PUT /api/items/{id}
   */
  update(id: number, body: UpdateItemBody): Observable<ItemDetailDto> {
    return this.http.put<ItemDetailDto>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/items/{id}
   * Backend: SoftDeleteItemCommand(int Id, string RowVersion)
   */
  delete(id: number, rowVersion: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      body: { id, rowVersion }
    });
  }
}
