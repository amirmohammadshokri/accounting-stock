import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { EntityActionsCell, EntityActionsContext } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PaymentsService } from '../../core/services/payments.service';
import { PaymentListItemDto, getPaymentDirectionDisplayName } from '../../core/models/payment.models';
import { PaymentFormDialogComponent, PaymentFormDialogData } from './payment-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-payments-page',
  imports: [AgGridAngular, GridPaginatorComponent, CommonModule, MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective],
  template: `
    <div class="toolbar">
      <span class="title">پرداخت‌ها</span>
      <span class="spacer"></span>
      <button *appHasPermission="'Payment.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        پرداخت جدید
      </button>
    </div>

    <div class="grid-heading"><h2>پرداخت‌ها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
  `]
})
export class PaymentsPageComponent {
  sortWhitelist = ['dateUtc', 'amount']; // BE whitelist

  colDefs: ColDef<PaymentListItemDto>[] = [
    { field: 'dateUtc', headerName: 'تاریخ و ساعت', sortable: true, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : '' },
    { headerName: 'نوع', colId:'direction', sortable: false, minWidth: 110, valueGetter: p => p.data ? getPaymentDirectionDisplayName(p.data.direction) : '' },
    { field: 'accountCode', headerName: 'کد حساب', sortable: false, minWidth: 120 },
    { field: 'accountName', headerName: 'نام حساب', sortable: false, minWidth: 160 },
    { field: 'contactCode', headerName: 'کد طرف حساب', sortable: false, minWidth: 120 },
    { field: 'contactName', headerName: 'نام طرف حساب', sortable: false, minWidth: 160 },
    { field: 'amount', headerName: 'مبلغ', sortable: true, type: 'rightAligned', minWidth: 120 },
    { field: 'currency', headerName: 'ارز', sortable: false, maxWidth: 100 },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<PaymentListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'Payment.Update',
    deletePermission: 'Payment.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<PaymentListItemDto>;

  constructor(
    private service: PaymentsService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) { }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string; }) =>
    this.service.list(q);

  openCreate() {
    const ref = this.dialog.open<PaymentFormDialogComponent, PaymentFormDialogData>(PaymentFormDialogComponent, {
      data: { payment: null }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('پرداخت ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: PaymentListItemDto) {
    this.service.getById(row.id).subscribe(full => {
      const ref = this.dialog.open<PaymentFormDialogComponent, PaymentFormDialogData>(PaymentFormDialogComponent, {
        data: {
          payment: full,
          accountLabel: `${row.accountCode} - ${row.accountName}`,
          contactLabel: row.contactCode ? `${row.contactCode} - ${row.contactName}` : null
        }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(full.id, {
          id: full.id,
          rowVersion: full.rowVersion,
          ...result
        }).subscribe({
          next: () => {
            this.snack.open('پرداخت به‌روزرسانی شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }

  confirmDelete(row: PaymentListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف پرداخت',
        message: `پرداخت حساب ${row.accountCode} به مبلغ ${row.amount} ${row.currency} حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.getById(row.id).subscribe(full => {
        this.service.delete(row.id, full.rowVersion).subscribe({
          next: () => {
            this.snack.open('پرداخت حذف شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }
}
