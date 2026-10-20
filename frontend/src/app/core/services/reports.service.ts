/**
 * Reports Service
 * Backend: ReportsController
 * @see Accounting.Api.Controllers.ReportsController
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStatsDto, ContactStatementDto, StockStatusDto, IncomeExpenseDto } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/reports`;

  /**
   * GET /api/reports/dashboard
   */
  getDashboard(branchId: number): Observable<DashboardStatsDto> {
    return this.http.get<DashboardStatsDto>(`${this.baseUrl}/dashboard`, {
      params: { branchId }
    });
  }

  /**
   * GET /api/reports/contact/{contactId}/statement
   */
  getContactStatement(contactId: number, dateFrom?: string | null, dateTo?: string | null): Observable<ContactStatementDto> {
    return this.http.get<ContactStatementDto>(`${this.baseUrl}/contact/${contactId}/statement`, {
      params: this.buildStatementParams(dateFrom, dateTo)
    });
  }

  /**
   * GET /api/reports/contact/{contactId}/statement/export
   */
  exportContactStatement(contactId: number, dateFrom?: string | null, dateTo?: string | null): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/contact/${contactId}/statement/export`, {
      params: this.buildStatementParams(dateFrom, dateTo),
      responseType: 'blob'
    });
  }

  private buildStatementParams(dateFrom?: string | null, dateTo?: string | null): HttpParams {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return params;
  }

  /**
   * GET /api/reports/stock-status
   */
  getStockStatus(): Observable<StockStatusDto[]> {
    return this.http.get<StockStatusDto[]>(`${this.baseUrl}/stock-status`);
  }

  /**
   * GET /api/reports/stock-status/export
   */
  exportStockStatus(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/stock-status/export`, { responseType: 'blob' });
  }

  /**
   * GET /api/reports/income-expense
   */
  getIncomeExpense(branchId?: number | null, dateFrom?: string | null, dateTo?: string | null): Observable<IncomeExpenseDto> {
    let params = new HttpParams();
    if (branchId != null) params = params.set('branchId', branchId);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return this.http.get<IncomeExpenseDto>(`${this.baseUrl}/income-expense`, { params });
  }
}
