import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { ChequesService } from '../../core/services/cheques.service';
import {
  ChequeDetailDto, ChequeStatus, ChequeStatusStr, ChequeTypeStr, ChequeDirectionStr,
  getChequeTypeDisplayName, getChequeDirectionDisplayName, getChequeStatusDisplayName
} from '../../core/models/cheque.models';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { ChequeActionsCell, ChequeActionsContext } from './cheque-actions.cell';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ChequeFormDialogComponent } from './cheque-form-dialog.component';
import { ChequeCashDialogComponent } from './cheque-cash-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  standalone: true,
  selector: 'app-cheques-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule,
    ...APP_ICON_IMPORTS,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    PagedGridDirective,
    HasPermissionDirective
  ],
  template: `
    

    <div class="toolbar"><span class="title">چک‌ها و سفته‌ها</span>
      
      <span class="spacer"></span>
      <button *appHasPermission="'Cheque.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        چک / سفته جدید
      </button>
    </div>
<app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field appearance="outline" class="filter-field">
          <mat-label>نوع</mat-label>
          <mat-select [(ngModel)]="type">
            <mat-option [value]="null">همه</mat-option>
            <mat-option value="Cheque">چک</mat-option>
            <mat-option value="PromissoryNote">سفته</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>جهت</mat-label>
          <mat-select [(ngModel)]="direction">
            <mat-option [value]="null">همه</mat-option>
            <mat-option value="Inbound">دریافتی</mat-option>
            <mat-option value="Outbound">پرداختی</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>وضعیت</mat-label>
          <mat-select [(ngModel)]="status">
            <mat-option [value]="null">همه</mat-option>
            <mat-option value="Pending">در دست</mat-option>
            <mat-option value="Paid">دریافت / پرداخت شده</mat-option>
            <mat-option value="Endorsed">واگذار شده</mat-option>
            <mat-option value="Bounced">برگشتی</mat-option>
            <mat-option value="Cancelled">لغو</mat-option>
          </mat-select>
        </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>چک‌ها و سفته‌ها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
export class ChequesPageComponent {
  // Backend ListChequesQuery Sort desteklemiyor.
  sortWhitelist: string[] = [];
  type: ChequeTypeStr | null = null;
  direction: ChequeDirectionStr | null = null;
  status: ChequeStatusStr | null = null;

  colDefs: ColDef<ChequeDetailDto>[] = [
    { field: 'id', headerName: 'شناسه', sortable: false, maxWidth: 80, pinned: 'right' },
    { field: 'chequeNumber', headerName: 'شماره چک / سفته', sortable: false, minWidth: 140, pinned: 'right' },
    { field: 'type', headerName: 'نوع', sortable: false, maxWidth: 90, valueFormatter: p => getChequeTypeDisplayName(p.value) },
    { field: 'direction', headerName: 'جهت', sortable: false, maxWidth: 100, valueFormatter: p => getChequeDirectionDisplayName(p.value) },
    { field: 'status', headerName: 'وضعیت', sortable: false, minWidth: 130, valueFormatter: p => getChequeStatusDisplayName(p.value) },
    { field: 'amount', headerName: 'مبلغ', sortable: false, type: 'rightAligned', minWidth: 120 },
    { field: 'currency', headerName: 'واحد پول', sortable: false, maxWidth: 100 },
    { field: 'contactName', headerName: 'طرف حساب', sortable: false, minWidth: 180, valueGetter: p => p.data?.contactName ?? '—' },
    {
      field: 'issueDate', headerName: 'تاریخ صدور', sortable: false, minWidth: 130,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : ''
    },
    {
      field: 'dueDate', headerName: 'تاریخ سررسید', sortable: false, minWidth: 130,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : ''
    },
    { field: 'drawerName', headerName: 'صادرکننده', sortable: false, minWidth: 150, valueGetter: p => p.data?.drawerName ?? '—' },
    { field: 'bankName', headerName: 'بانک', sortable: false, minWidth: 140, valueGetter: p => p.data?.bankName ?? '—' },
    {
      headerName: '',
      colId: 'actions',
      width: 190,
      pinned: 'left',
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: ChequeActionsCell
    }
  ];

  gridContext: ChequeActionsContext<ChequeDetailDto> = {
    onCash: (row) => this.cash(row),
    onEndorse: (row) => this.endorse(row),
    onBounce: (row) => this.bounce(row),
    onCancel: (row) => this.cancel(row),
    onDelete: (row) => this.confirmDelete(row)
  };

  @ViewChild('grid') grid!: PagedGridDirective<ChequeDetailDto>;

  constructor(
    private service: ChequesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number }) => {
    return this.service.list({
      filters:q.filters, page: q.pageNumber,
      pageSize: q.pageSize,
      type: this.type ?? undefined,
      direction: this.direction ?? undefined,
      status: this.status ?? undefined
    });
  };

  apply() { this.grid.reload(); }

  reset() {
    this.type = null;
    this.direction = null;
    this.status = null;
    this.grid.reload();
  }

  openCreate() {
    const ref = this.dialog.open(ChequeFormDialogComponent, { data: {} });
    ref.afterClosed().subscribe(body => {
      if (!body) return;
      this.service.create(body).subscribe({
        next: () => {
          this.snack.open('چک / سفته ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        },
        error: err => {
          const msg = err?.error?.message ?? 'ذخیره ناموفق بود.';
          this.snack.open(msg, 'بستن', { duration: 3000 });
        }
      });
    });
  }

  cash(row: ChequeDetailDto) {
    const ref = this.dialog.open(ChequeCashDialogComponent, { data: { cheque: row } });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.updateStatus(row.id, {
        newStatus: ChequeStatus.Paid,
        rowVersionBase64: row.rowVersionBase64,
        transactionDate: result.transactionDate,
        cashBankAccountId: result.cashBankAccountId
      }).subscribe({
        next: () => {
          this.snack.open(row.direction === 'Inbound' ? 'دریافت ثبت شد.' : 'پرداخت ثبت شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        },
        error: err => this.snack.open(this.concurrencyOrDefault(err, 'عملیات ناموفق بود.'), 'بستن', { duration: 3000 })
      });
    });
  }

  endorse(row: ChequeDetailDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'واگذاری',
        message: `"${row.chequeNumber}" واگذار شود؟`,
        danger: false
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.updateStatus(row.id, {
        newStatus: ChequeStatus.Endorsed,
        rowVersionBase64: row.rowVersionBase64
      }).subscribe({
        next: () => {
          this.snack.open('سند واگذار شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        },
        error: err => this.snack.open(this.concurrencyOrDefault(err, 'واگذاری ناموفق بود.'), 'بستن', { duration: 3000 })
      });
    });
  }

  bounce(row: ChequeDetailDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'ثبت برگشت چک',
        message: `"${row.chequeNumber}" به‌عنوان برگشتی ثبت شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.updateStatus(row.id, {
        newStatus: ChequeStatus.Bounced,
        rowVersionBase64: row.rowVersionBase64
      }).subscribe({
        next: () => {
          this.snack.open('سند به‌عنوان برگشتی ثبت شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        },
        error: err => this.snack.open(this.concurrencyOrDefault(err, 'عملیات ناموفق بود.'), 'بستن', { duration: 3000 })
      });
    });
  }

  cancel(row: ChequeDetailDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'لغو چک / سفته',
        message: `"${row.chequeNumber}" لغو شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.updateStatus(row.id, {
        newStatus: ChequeStatus.Cancelled,
        rowVersionBase64: row.rowVersionBase64
      }).subscribe({
        next: () => {
          this.snack.open('سند لغو شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        },
        error: err => this.snack.open(this.concurrencyOrDefault(err, 'لغو ناموفق بود.'), 'بستن', { duration: 3000 })
      });
    });
  }

  confirmDelete(row: ChequeDetailDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف چک / سفته',
        message: `"${row.chequeNumber}" حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.delete(row.id, row.rowVersionBase64).subscribe({
        next: () => {
          this.snack.open('چک / سفته حذف شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        },
        error: err => this.snack.open(this.concurrencyOrDefault(err, 'حذف ناموفق بود.'), 'بستن', { duration: 3000 })
      });
    });
  }

  private concurrencyOrDefault(err: any, fallback: string): string {
    if (err?.error?.code === 'concurrency_conflict' || err?.status === 409) {
      return 'رکورد توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.';
    }
    return err?.error?.message ?? fallback;
  }
}
