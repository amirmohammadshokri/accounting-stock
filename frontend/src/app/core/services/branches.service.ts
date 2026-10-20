/**
 * Branches Service
 * Backend: BranchesController
 * @see Accounting.Api.Controllers.BranchesController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BranchDto,
  BranchListItemDto,
  CreateBranchBody,
  UpdateBranchBody
} from '../models/branch.models';

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/branches`;

  /**
   * POST /api/branches
   */
  create(body: CreateBranchBody): Observable<BranchDto> {
    return this.http.post<BranchDto>(this.baseUrl, body);
  }

  /**
   * GET /api/branches/{id}
   */
  getById(id: number): Observable<BranchDto> {
    return this.http.get<BranchDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/branches
   */
  list(): Observable<BranchListItemDto[]> {
    return this.http.get<BranchListItemDto[]>(this.baseUrl);
  }

  /**
   * PUT /api/branches/{id}
   */
  update(id: number, body: UpdateBranchBody): Observable<BranchDto> {
    return this.http.put<BranchDto>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/branches/{id}
   * NOTE: Backend uses query param for rowVersion, not body!
   */
  delete(id: number, rowVersion: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: { rowVersion }
    });
  }
}
