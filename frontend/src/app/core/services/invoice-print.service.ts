import { InvoicePrintFormat, InvoicePrintLayout } from '../models/invoice-print-layout.models';
import { Injectable, inject, signal } from '@angular/core';
import { HANDLE_ERROR_LOCALLY } from '../interceptors/http-problem-interceptor';
import { HttpClient, HttpContext } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { persianError } from '../utils/persian-errors';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoicePrintService {
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  private readonly downloading = signal<ReadonlySet<number>>(new Set());
  isDownloading(id: number): boolean { return this.downloading().has(id); }

  download(id: number, format: InvoicePrintFormat = 'a4-portrait'): void {
    if (!Number.isInteger(id) || id <= 0 || this.isDownloading(id)) return;
    this.downloading.update(ids => new Set([...ids, id]));
    this.http.get(`${environment.apiBaseUrl}/invoices/${id}/pdf`, {
      params: { format }, responseType: 'blob', context: new HttpContext().set(HANDLE_ERROR_LOCALLY, true)
    }).subscribe({
      next: blob => {
        this.finishDownload(id);
        if (!blob.size || blob.type.split(';')[0].toLowerCase() !== 'application/pdf') {
          this.snack.open('پاسخ سرویس، فایل PDF معتبر نیست.', 'بستن', { duration: 6000 });
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${id}${format === 'a4-portrait' ? '' : '-' + format}.pdf`;
        document.body.appendChild(link);
        try { link.click(); } finally {
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
      },
      error: err => { this.finishDownload(id); void this.showError(err); }
    });
  }

  private finishDownload(id: number): void {
    this.downloading.update(ids => { const next = new Set(ids); next.delete(id); return next; });
  }

  private async showError(err: { error?: unknown; status?: number }): Promise<void> {
    let message = persianError(undefined, err.status);
    let problem: any = err.error;
    if (problem instanceof Blob) {
      try { problem = JSON.parse(await problem.text()); } catch { problem = null; }
    }
    if (typeof problem?.detail === 'string' && problem.detail.trim()) message = problem.detail;
    else if (typeof problem?.message === 'string' && problem.message.trim()) message = problem.message;
    if (problem?.errors && typeof problem.errors === 'object') {
      const errors = Object.values(problem.errors).flat().filter((value): value is string => typeof value === 'string');
      if (errors.length) message += '\n' + errors.join('، ');
    }
    this.snack.open(message, 'بستن', { duration: 8000 });
  }

  open(id: number, format: InvoicePrintFormat = 'a4-portrait', draft?: InvoicePrintLayout): void {
    if (!Number.isInteger(id) || id <= 0 || this.isDownloading(id)) return;
    const preview = window.open('', '_blank');
    if (!preview) {
      this.snack.open('برای نمایش فاکتور، اجازهٔ باز شدن پنجرهٔ جدید را بدهید.', 'بستن', { duration: 5000 });
      return;
    }
    this.downloading.update(ids => new Set([...ids, id]));
    preview.opener = null;
    preview.document.title = 'آماده‌سازی فاکتور';
    preview.document.body.textContent = 'در حال آماده‌سازی نسخهٔ چاپی فاکتور… پس از نمایش PDF، از ابزارهای نمایشگر برای چاپ یا دانلود استفاده کنید.';
    preview.document.documentElement.dir = 'rtl';
    const options = { responseType: 'blob' as const, context: new HttpContext().set(HANDLE_ERROR_LOCALLY, true) };
    const request = draft
      ? this.http.post(`${environment.apiBaseUrl}/invoice-print-layouts/preview/${id}`, draft, options)
      : this.http.get(`${environment.apiBaseUrl}/invoices/${id}/pdf`, { ...options, params: { format } });
    request.subscribe({
      next: blob => {
        this.finishDownload(id);
        if (!blob.size || blob.type.split(';')[0].toLowerCase() !== 'application/pdf') {
          preview.close();
          this.snack.open('پاسخ سرویس، فایل PDF معتبر نیست.', 'بستن', { duration: 6000 });
          return;
        }
        if (preview.closed) return;
        const url = URL.createObjectURL(blob);
        preview.location.replace(url);
        window.setTimeout(() => URL.revokeObjectURL(url), 300000);
      },
      error: err => {
        this.finishDownload(id);
        preview.close();
        void this.showError(err);
      }
    });
  }
}
