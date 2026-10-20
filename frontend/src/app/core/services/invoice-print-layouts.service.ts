import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InvoicePrintFormat, InvoicePrintLayout, InvoicePrintLayoutVersion } from '../models/invoice-print-layout.models';
@Injectable({providedIn:'root'})
export class InvoicePrintLayoutsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/invoice-print-layouts`;
  get(format: InvoicePrintFormat) { return this.http.get<InvoicePrintLayoutVersion>(`${this.base}/${format}`); }
  save(layout: InvoicePrintLayout, version: string) { return this.http.put<InvoicePrintLayoutVersion>(`${this.base}/${layout.format}`, {layout, version}); }
}
