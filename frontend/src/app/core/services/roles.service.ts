/**
 * Roles Service
 * Backend: RolesController
 * @see Accounting.Api.Controllers.RolesController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RoleListItemDto,
  RoleDetailDto,
  CreateRoleBody,
  UpdateRoleBody
} from '../models/role.models';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/roles`;

  /**
   * POST /api/roles
   */
  create(body: CreateRoleBody): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, body);
  }

  /**
   * GET /api/roles/{id}
   */
  getById(id: number): Observable<RoleDetailDto> {
    return this.http.get<RoleDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/roles — backend returns a plain unpaginated list, no query params.
   */
  list(): Observable<RoleListItemDto[]> {
    return this.http.get<RoleListItemDto[]>(this.baseUrl);
  }

  /**
   * PUT /api/roles/{id}
   */
  update(id: number, body: UpdateRoleBody): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/roles/{id}
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
