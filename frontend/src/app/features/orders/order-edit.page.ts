import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrdersService } from '../../core/services/orders.service';
import { OrderFormComponent, OrderFormValue } from './orders-form.component';
import { OrderType } from '../../core/models/order.models';

@Component({
  standalone: true,
  selector: 'app-order-edit-page',
  imports: [CommonModule, OrderFormComponent, MatSnackBarModule],
  template: `
  <app-order-form
    [mode]="mode"
    [value]="formValue"
    (saveInsert)="handleInsert($event)"
    (saveUpdate)="handleUpdate($event)"
  ></app-order-form>
  `
})
export class OrderEditPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(OrdersService);
  private snack = inject(MatSnackBar);

  id: number | null = null;
  mode: 'insert' | 'update' | 'view' = 'insert';
  formValue: OrderFormValue | null = null;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    // Route'un kendi `data.mode`'u ('insert' | 'edit' | 'view') — Invoices modülüyle
    // aynı desen: URL'in '/edit' ile bitip bitmediğine bakmak yerine route data'sı okunur.
    const routeMode = this.route.snapshot.data['mode'] as 'insert' | 'edit' | 'view' | undefined;
    const isView = routeMode === 'view';

    if (!idParam) {
      this.mode = 'insert';
      this.formValue = {
        contactId: null,
        dateUtc: new Date().toISOString(),
        type: OrderType.Sales,
        currency: 'IRR',
        description: null,
        lines: []
      };
      return;
    }

    this.id = Number(idParam);
    this.mode = isView ? 'view' : 'update';

    this.svc.getById(this.id).subscribe({
      next: dto => {
        this.formValue = {
          id: dto.id,
          rowVersionBase64: dto.rowVersion,
          branchId: dto.branchId,
          contactId: dto.contactId,
          contactName: dto.contactName,
          dateUtc: dto.dateUtc,
          type: dto.type,
          currency: dto.currency,
          description: dto.description,
          lines: dto.lines.map(l => ({
            id: l.id,
            itemId: l.itemId ?? null,  // undefined → null dönüşümü
            itemName: l.itemName,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountRate:l.discountRate,withholdingRate:l.withholdingRate,
            vatRate: l.vatRate
          }))
        };
      },
      error: _ => this.snack.open('سفارش یافت نشد.', 'بستن', { duration: 3000 })
    });
  }

  handleInsert(body: any) {
    // BranchId body'de yok — backend her zaman çağıranın kendi şubesini kullanıyor
    // (CreateOrderCommand'da BranchId alanı hiç yok, CreateOrderHandler
    // ICurrentUserService.BranchId'yi kullanıyor).
    this.svc.create(body).subscribe({
      next: res => {
        this.snack.open('سفارش ایجاد شد.', 'بستن', { duration: 2000 });
        this.router.navigate(['/orders', res.id, 'edit']);
      },
      error: _ => this.snack.open('ذخیره ناموفق بود.', 'بستن', { duration: 3000 })
    });
  }

  handleUpdate(body: any) {
    if (!this.id) return;
    body.id = this.id;
    this.svc.update(this.id, body).subscribe({
      next: dto => {
        this.snack.open('سفارش به‌روزرسانی شد.', 'بستن', { duration: 2000 });
        // yeni rowVersion + snapshot ile formu tazele
        this.formValue = {
          id: dto.id,
          rowVersionBase64: dto.rowVersion,
          branchId: dto.branchId,
          contactId: dto.contactId,
          contactName: dto.contactName,
          dateUtc: dto.dateUtc,
          type: dto.type,
          currency: dto.currency,
          description: dto.description,
          lines: dto.lines.map(l => ({
            id: l.id, itemId: l.itemId ?? null, itemName: l.itemName, description: l.description,
            quantity: l.quantity, unitPrice: l.unitPrice, discountRate:l.discountRate,withholdingRate:l.withholdingRate, vatRate: l.vatRate
          }))
        };
      },
      error: err => {
        if (err?.error?.code === 'concurrency_conflict')
          this.snack.open('رکورد توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.', 'بستن', { duration: 4000 });
        else
          this.snack.open('به‌روزرسانی ناموفق بود.', 'بستن', { duration: 3000 });
      }
    });
  }
}
