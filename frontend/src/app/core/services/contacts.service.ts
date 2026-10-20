/**
 * Contacts Service
 * Backend: ContactsController
 * @see Accounting.Api.Controllers.ContactsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ContactDto,
  ContactListItemDto,
  ListContactsQuery,
  CreateContactBody,
  UpdateContactBody
} from '../models/contact.models';
import { PagedResult } from '../models/paged-result';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/contacts`;

  /**
   * POST /api/contacts
   */
  create(body: CreateContactBody): Observable<ContactDto> {
    return this.http.post<ContactDto>(this.baseUrl, body);
  }

  /**
   * GET /api/contacts/{id}
   */
  getById(id: number): Observable<ContactDto> {
    return this.http.get<ContactDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/contacts
   */
  list(query: ListContactsQuery = {}): Observable<PagedResult<ContactListItemDto>> {
    let params = new HttpParams();
    if(query.filters)params=params.set('filters',query.filters);
    if (query.branchId != null) params = params.set('branchId', query.branchId.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.isCustomer != null) params = params.set('isCustomer', query.isCustomer.toString());
    if (query.isVendor != null) params = params.set('isVendor', query.isVendor.toString());
    if (query.isEmployee != null) params = params.set('isEmployee', query.isEmployee.toString());
    if (query.isRetail != null) params = params.set('isRetail', query.isRetail.toString());
    if (query.sort) params = params.set('sort', query.sort);
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    return this.http.get<PagedResult<ContactListItemDto>>(this.baseUrl, { params });
  }

  /**
   * PUT /api/contacts/{id}
   */
  update(id: number, body: UpdateContactBody): Observable<ContactDto> {
    return this.http.put<ContactDto>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /api/contacts/{id}
   */
  delete(id: number, rowVersion: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      body: { rowVersion }
    });
  }
}
