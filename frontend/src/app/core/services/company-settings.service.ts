/**
 * Company Settings Service
 * Backend: CompanySettingsController
 * @see Accounting.Api.Controllers.CompanySettingsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompanySettingsDto,
  UpdateCompanySettingsBody
} from '../models/company-settings.models';

@Injectable({ providedIn: 'root' })
export class CompanySettingsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/company-settings`;

  /**
   * GET /api/company-settings
   */
  get(): Observable<CompanySettingsDto> {
    return this.http.get<CompanySettingsDto>(this.baseUrl);
  }

  /**
   * PUT /api/company-settings
   */
  update(body: UpdateCompanySettingsBody): Observable<CompanySettingsDto> {
    return this.http.put<CompanySettingsDto>(this.baseUrl, body);
  }
}
