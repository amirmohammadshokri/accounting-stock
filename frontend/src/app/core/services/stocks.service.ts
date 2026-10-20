/**
 * Stocks Service
 * Backend: StocksController
 * @see Accounting.Api.Controllers.StocksController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StockDetailDto,
  StockListItemDto,
  ListStocksQuery
} from '../models/stock.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class StocksService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/stocks`;

  /**
   * GET /api/stocks/{id}
   */
  getById(id: number): Observable<StockDetailDto> {
    return this.http.get<StockDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/stocks
   */
  list(query: ListStocksQuery = {}): Observable<PagedResult<StockListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.branchId != null) params = params.set('branchId', query.branchId.toString());
    if (query.warehouseId != null) params = params.set('warehouseId', query.warehouseId.toString());
    if (query.itemId != null) params = params.set('itemId', query.itemId.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<PagedResult<StockListItemDto>>(this.baseUrl, { params });
  }

  /**
   * GET /api/stocks/export
   */
  export(query: ListStocksQuery = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.branchId != null) params = params.set('branchId', query.branchId.toString());
    if (query.warehouseId != null) params = params.set('warehouseId', query.warehouseId.toString());
    if (query.itemId != null) params = params.set('itemId', query.itemId.toString());
    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob' });
  }
}
