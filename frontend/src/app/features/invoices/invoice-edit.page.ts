import { InvoicePrintButtonComponent } from '../../shared/invoice-print-button/invoice-print-button.component';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { PermissionService } from '../../core/services/permission.service';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvoicesService } from '../../core/services/invoices.service';
import { InvoiceFormComponent, InvoiceFormValue } from './invoices-form.component';

@Component({
  standalone: true,
  selector: 'app-invoices-edit-page',
  imports: [InvoicePrintButtonComponent, CommonModule, InvoiceFormComponent, MatSnackBarModule, MatButtonModule, ...APP_ICON_IMPORTS],
  template: `
  <app-invoice-print-button *ngIf="id && canPrint" [invoiceId]="id!" style="margin-bottom:12px"></app-invoice-print-button>
  <p *ngIf="id && canPrint" class="print-hint">نسخهٔ چاپی از اطلاعات ذخیره‌شدهٔ فاکتور تهیه می‌شود. برای چاپ، از گزینهٔ چاپ در نمایشگر PDF استفاده کنید.</p>
  <div *ngIf="saveError" role="alert" style="padding:12px; margin-bottom:12px; border:1px solid var(--mat-sys-error); border-radius:8px; white-space:pre-line">
    {{ saveError }}

  </div>
  <app-invoice-form
    [mode]="mode"
    [value]="formValue"
    (saveInsert)="handleInsert($event)"
    (saveUpdate)="handleUpdate($event)"
  ></app-invoice-form>
  `
})
export class InvoicesEditPage {
  readonly canPrint = inject(PermissionService).has('Invoice.Read');
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(InvoicesService);
  private snack = inject(MatSnackBar);

  saveError: string | null = null;
  stockError = false;
  private showSaveError(err: any) {
    this.saveError = err?.error?.detail || err?.error?.message || 'ذخیره فاکتور ناموفق بود. دوباره تلاش کنید.';
    this.stockError = /موجودی|stok/i.test(this.saveError ?? '');
  }
  id: number | null = null;
  mode: 'insert' | 'update' | 'view' = 'insert';
  formValue: InvoiceFormValue | null = null;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    // Route'un kendi `data.mode`'u ('insert' | 'edit' | 'view') — önceden URL'in
    // '/edit' ile bitip bitmediğine bakılıyordu, route yapısı değişince kırılabilirdi.
    const routeMode = this.route.snapshot.data['mode'] as 'insert' | 'edit' | 'view' | undefined;
    const isView = routeMode === 'view';

    if (!idParam) {
      this.mode = 'insert';
      this.formValue = {
        contactId: null,
        dateUtc: new Date().toISOString(),
        currency: 'IRR',
        type: 'Sales',
        lines: []
      };
      return;
    }

    this.id = Number(idParam);
    this.mode = isView ? 'view' : 'update';

    // Resolver varsa buradan okuyabilirsin. Şimdilik servisle alalım:
    this.svc.getById(this.id).subscribe({
      next: dto => {
        this.formValue = {
          id: dto.id,
          rowVersionBase64: dto.rowVersion,
          branchId: dto.branchId,
          branchCode: dto.branchCode,
          branchName: dto.branchName,
          contactId: dto.contactId,
          contactCode: dto.contactCode,
          contactName: dto.contactName,
          dateUtc: dto.dateUtc,
          currency: dto.currency,
          type: dto.type as any,
          notes: dto.notes,
          documentType: dto.documentType,
          waybillNumber: dto.waybillNumber,
          waybillDateUtc: dto.waybillDateUtc,
          paymentDueDateUtc: dto.paymentDueDateUtc,
          lines: dto.lines.map(l => ({
            id: l.id,
            itemId: l.itemId ?? null,  // undefined → null dönüşümü
            itemCode: l.itemCode,
            itemName: l.itemName,
            unit: l.unit,
            qty: l.qty,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            discountRate: l.discountRate,
            withholdingRate: l.withholdingRate,
            net: l.net, vat: l.vat, grandTotal: l.grandTotal
          }))
        };

      },
      error: _ => this.snack.open('فاکتور یافت نشد.', 'بستن', { duration: 3000 })
    });
  }

  handleInsert(body: any) {
    this.saveError = null; this.stockError = false;
    // BranchId body'de yok — backend her zaman çağıranın kendi şubesini kullanıyor
    // (CreateInvoiceCommand'da BranchId alanı hiç yok, CreateInvoiceHandler
    // ICurrentUserService.BranchId'yi kullanıyor).
    this.svc.create(body).subscribe({
      next: res => {
        this.snack.open('فاکتور ایجاد شد.', 'بستن', { duration: 2000 });
        this.router.navigate(['/invoices', res.id, 'edit']);
      },
      error: err => this.showSaveError(err)
    });
  }

  handleUpdate(body: any) {
    this.saveError = null; this.stockError = false;
    if (!this.id) return;
    body.id = this.id;
    this.svc.update(this.id, body).subscribe({  // id parametresi eklendi
      next: dto => {
        this.snack.open('فاکتور به‌روزرسانی شد.', 'بستن', { duration: 2000 });
        // yeni rowVersion + snapshot ile formu tazele
        this.formValue = {
          id: dto.id,
          rowVersionBase64: dto.rowVersion,
          branchId: dto.branchId,
          branchCode: dto.branchCode,
          branchName: dto.branchName,
          contactId: dto.contactId,
          contactCode: dto.contactCode,
          contactName: dto.contactName,
          dateUtc: dto.dateUtc,
          currency: dto.currency,
          type: dto.type as any,
          notes: dto.notes,
          documentType: dto.documentType,
          waybillNumber: dto.waybillNumber,
          waybillDateUtc: dto.waybillDateUtc,
          paymentDueDateUtc: dto.paymentDueDateUtc,
          lines: dto.lines.map(l => ({
            id: l.id, itemId: l.itemId ?? null, itemCode: l.itemCode, itemName: l.itemName, unit: l.unit,  // undefined → null
            qty: l.qty, unitPrice: l.unitPrice, vatRate: l.vatRate,
            discountRate: l.discountRate, withholdingRate: l.withholdingRate,
            net: l.net, vat: l.vat, grandTotal: l.grandTotal
          }))
        };
      },
      error: err => {
        if (err?.error?.code === 'concurrency_conflict')
          this.snack.open('رکورد توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.', 'بستن', { duration: 4000 });
        else
          this.showSaveError(err);
      }
    });
  }
}
