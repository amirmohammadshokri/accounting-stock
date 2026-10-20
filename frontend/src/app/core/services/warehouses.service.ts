/**
 * Warehouses Service
 * Backend: WarehousesController
 * @see Accounting.Api.Controllers.WarehousesController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WarehouseDto,
  WarehouseListItemDto,
  ListWarehousesQuery,
  CreateWarehouseBody,
  UpdateWarehouseBody
} from '../models/warehouse.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class WarehousesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/warehouses`;

  /**
   * POST /api/warehouses
   */
  create(body: CreateWarehouseBody): Observable<WarehouseDto> {
    return this.http.post<WarehouseDto>(this.baseUrl, body);
  }

  /**
   * GET /api/warehouses/{id}
   */
  getById(id: number): Observable<WarehouseDto> {
    return this.http.get<WarehouseDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/warehouses
   */
  list(query: ListWarehousesQuery = {}): Observable<PagedResult<WarehouseListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.branchId != null) params = params.set('branchId', query.branchId.toString());
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<PagedResult<WarehouseListItemDto>>(this.baseUrl, { params });
  }

  /**
   * PUT /api/warehouses/{id}
   */
  update(id: number, body: UpdateWarehouseBody): Observable<WarehouseDto> {
    return this.http.put<WarehouseDto>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/warehouses/{id}
   */
  delete(id: number, rowVersion: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      body: { rowVersion }
    });
  }
}
