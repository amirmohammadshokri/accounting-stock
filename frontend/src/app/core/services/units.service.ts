/**
 * Units Service
 * Backend: UnitsController
 * @see Accounting.Api.Controllers.UnitsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UnitListItemDto,
  ListUnitsQuery, UnitDetailDto, CreateUnitBody, UpdateUnitBody
} from '../models/unit.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/units`;

  /**
   * GET /api/units
   */
  list(query: ListUnitsQuery = {}): Observable<PagedResult<UnitListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.search) params = params.set('search', query.search);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    return this.http.get<PagedResult<UnitListItemDto>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<UnitDetailDto> {
    return this.http.get<UnitDetailDto>(`${this.baseUrl}/${id}`);
  }
  create(body: CreateUnitBody): Observable<UnitDetailDto> {
    return this.http.post<UnitDetailDto>(this.baseUrl, body);
  }
  update(id: number, body: UpdateUnitBody): Observable<UnitDetailDto> {
    return this.http.put<UnitDetailDto>(`${this.baseUrl}/${id}`, body);
  }
  delete(id: number, rowVersion: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params: new HttpParams().set('rowVersion', rowVersion) });
  }
}
