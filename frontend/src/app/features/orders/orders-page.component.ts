import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { OrdersService } from '../../core/services/orders.service';
import { OrderListItemDto, OrderStatus, getOrderStatusDisplayName, getOrderTypeDisplayName } from '../../core/models/order.models';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { OrderActionsCell, OrderActionsContext } from './order-actions.cell';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BranchListItemDto } from '../../core/models/branch.models';
import { BranchesService } from '../../core/services/branches.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  standalone: true,
  selector: 'app-orders-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule,
    ...APP_ICON_IMPORTS,
    MatButtonModule,
    MatDialogModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    PagedGridDirective,
    HasPermissionDirective
  ],
  template: `
    

    <div class="toolbar"><span class="title">سفارش‌ها</span>
      
      <span class="spacer"></span>
      <a *appHasPermission="'Order.Create'" mat-stroked-button color="primary" routerLink="/orders/new">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        سفارش جدید
      </a>
    </div>
<app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field *appHasPermission="'Branch.Read'" appearance="outline" class="branch-field">
          <mat-label>شعبه</mat-label>
          <mat-select [(ngModel)]="branchId">
            <mat-option [value]="null">همه شعبه‌ها</mat-option>
            <mat-option *ngFor="let b of branches" [value]="b.id">
              {{ b.code }} - {{ b.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="status-field">
          <mat-label>وضعیت</mat-label>
          <mat-select [(ngModel)]="status">
            <mat-option [value]="null">همه</mat-option>
            <mat-option [value]="OrderStatus.Draft">پیش‌نویس</mat-option>
            <mat-option [value]="OrderStatus.Approved">تأیید شده</mat-option>
            <mat-option [value]="OrderStatus.Invoiced">فاکتور شده</mat-option>
            <mat-option [value]="OrderStatus.Cancelled">لغو</mat-option>
          </mat-select>
        </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>سفارش‌ها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
<ag-grid-angular class="app-data-grid"
      #grid="appPagedGrid"
      [columnDefs]="colDefs"
      [sortWhitelist]="sortWhitelist"
      [appPagedGrid]="fetcher"
      [context]="gridContext"></ag-grid-angular>
<app-grid-paginator [grid]="grid"></app-grid-paginator>
  `,
  styles: [`
    .toolbar { display:flex; align-items:center; padding:8px 0; }
    .title { font-weight:600; }
    .spacer { flex:1; }
    
    :host ::ng-deep .icon-btn{
      display:inline-flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:6px;text-decoration:none;
      margin-inline-start:4px;
    }
    :host ::ng-deep .icon-btn .material-icons{font-size:20px;line-height:20px}
    
  `]
})
export class OrdersPageComponent {
  // Backend ListOrdersQuery Sort desteklemiyor — sıralama backend'e gönderilmiyor.
  sortWhitelist: string[] = [];
  OrderStatus = OrderStatus;
  branchId: number | null = null;
  status: OrderStatus | null = null;
  branches: BranchListItemDto[] = [];

  colDefs: ColDef<OrderListItemDto>[] = [
    { field: 'id', headerName: 'شناسه', sortable: false, maxWidth: 80, pinned: 'right' },
    { field: 'orderNumber', headerName: 'شماره سفارش', sortable: false, minWidth: 140, pinned: 'right' },
    {
      field: 'type',
      headerName: 'نوع',
      sortable: false,
      maxWidth: 120,
      valueFormatter: p => getOrderTypeDisplayName(p.value)
    },
    {
      field: 'status',
      headerName: 'وضعیت',
      sortable: false,
      minWidth: 110,
      valueFormatter: p => getOrderStatusDisplayName(p.value)
    },
    {
      field: 'dateUtc',
      headerName: 'تاریخ',
      sortable: false,
      minWidth: 120,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : ''
    },
    { field: 'contactId', headerName: 'شناسه طرف حساب', sortable: false, maxWidth: 90 },
    { field: 'contactName', headerName: 'نام طرف حساب', sortable: false, minWidth: 200 },
    { field: 'branchId', headerName: 'شناسه شعبه', sortable: false, maxWidth: 90 },
    { field: 'currency', headerName: 'واحد پول', sortable: false, maxWidth: 100 },
    { field: 'totalNet', headerName: 'جمع خالص', sortable: false, type: 'rightAligned', minWidth: 130 },
    { field: 'totalVat', headerName: 'جمع مالیات بر ارزش افزوده', sortable: false, type: 'rightAligned', minWidth: 130 },
    { field: 'totalGross', headerName: 'مبلغ نهایی', sortable: false, type: 'rightAligned', minWidth: 140 },
    {
      field: 'createdAtUtc',
      headerName: 'زمان ایجاد',
      sortable: false,
      minWidth: 150,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleString('fa-IR') : ''
    },
    {
      headerName: '',
      colId: 'actions',
      width: 190,
      pinned: 'left',
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: OrderActionsCell
    }
  ];

  gridContext: OrderActionsContext<OrderListItemDto> = {
    onApprove: (row) => this.approve(row),
    onCancel: (row) => this.cancel(row),
    onConvertToInvoice: (row) => this.convertToInvoice(row),
    onDelete: (row) => this.confirmDelete(row)
  };

  @ViewChild('grid') grid!: PagedGridDirective<OrderListItemDto>;

  constructor(
    private service: OrdersService,
    private branchesService: BranchesService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private permissionService: PermissionService
  ) {
    if (this.permissionService.has('Branch.Read')) {
      this.branchesService.list().subscribe({
        next: (res) => (this.branches = res),
        error: () => { this.branches = []; }
      });
    }
  }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number }) => {
    return this.service.list({
      filters:q.filters, page: q.pageNumber,
      pageSize: q.pageSize,
      branchId: this.branchId ?? undefined,
      status: this.status ?? undefined
    });
  };

  apply() { this.grid.reload(); }

  reset() {
    this.branchId = null;
    this.status = null;
    this.grid.reload();
  }

  // Liste satırında rowVersion yok (OrderListItemDto'da yok) — Approve/Cancel/Delete
  // öncesi güncel rowVersion'ı almak için önce detay çekilir.
  private withRowVersion(id: number, action: (rowVersion: string) => void) {
    this.service.getById(id).subscribe({
      next: dto => action(dto.rowVersion),
      error: () => this.snack.open('دریافت اطلاعات سفارش ناموفق بود.', 'بستن', { duration: 3000 })
    });
  }

  approve(row: OrderListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'تأیید سفارش',
        message: `"${row.orderNumber}" تأیید شود؟`,
        danger: false
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.withRowVersion(row.id, rowVersion => {
        this.service.approve(row.id, rowVersion).subscribe({
          next: () => {
            this.snack.open('سفارش تأیید شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          },
          error: err => {
            const msg = err?.error?.code === 'concurrency_conflict'
              ? 'رکورد توسط کاربر دیگری تغییر کرده است؛ دوباره تلاش کنید.'
              : (err?.error?.message ?? 'تأیید ناموفق بود.');
            this.snack.open(msg, 'بستن', { duration: 3000 });
          }
        });
      });
    });
  }

  cancel(row: OrderListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'لغو سفارش',
        message: `"${row.orderNumber}" لغو شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.withRowVersion(row.id, rowVersion => {
        this.service.cancel(row.id, rowVersion).subscribe({
          next: () => {
            this.snack.open('سفارش لغو شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          },
          error: err => {
            const msg = err?.error?.code === 'concurrency_conflict'
              ? 'رکورد توسط کاربر دیگری تغییر کرده است؛ دوباره تلاش کنید.'
              : 'لغو ناموفق بود.';
            this.snack.open(msg, 'بستن', { duration: 3000 });
          }
        });
      });
    });
  }

  convertToInvoice(row: OrderListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'تبدیل به فاکتور',
        message: `"${row.orderNumber}" به فاکتور تبدیل شود؟`,
        danger: false
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.createInvoice(row.id).subscribe({
        next: () => {
          this.snack.open('فاکتور ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        },
        error: () => this.snack.open('ایجاد فاکتور ناموفق بود.', 'بستن', { duration: 3000 })
      });
    });
  }

  confirmDelete(row: OrderListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف سفارش',
        message: `"${row.orderNumber}" حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.withRowVersion(row.id, rowVersion => {
        this.service.delete(row.id, rowVersion).subscribe({
          next: () => {
            this.snack.open('سفارش حذف شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          },
          error: () => this.snack.open('حذف ناموفق بود.', 'بستن', { duration: 3000 })
        });
      });
    });
  }
}
