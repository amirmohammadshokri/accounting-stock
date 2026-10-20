import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { tap } from 'rxjs/operators';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { PersianPipe } from '../../shared/persian.pipe';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { InvoicesService } from '../../core/services/invoices.service';
import { InvoiceListItemDto } from '../../core/models/invoice.models';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { InvoiceActionsCell } from './invoice-actions.cell';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BranchListItemDto } from '../../core/models/branch.models';
import { BranchesService } from '../../core/services/branches.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  standalone: true,
  selector: 'app-invoices-page',
  imports: [FilterPanelComponent, PersianPipe, PersianDateFieldComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule,
    ...APP_ICON_IMPORTS,
    MatButtonModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PagedGridDirective,
    HasPermissionDirective
  ],
  template: `
    

    <div class="toolbar"><span class="title">فاکتورهای خرید و فروش</span>
      
      <span class="spacer"></span>
      <a *appHasPermission="'Invoice.Create'" mat-stroked-button color="primary" routerLink="/invoices/new">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        فاکتور جدید
      </a>
      <a *ngIf="canEditPrintLayouts" mat-stroked-button routerLink="/invoice-print-layouts"><mat-icon [svgIcon]="'edit'"></mat-icon>ویرایش قالب چاپ</a>
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

      <mat-form-field appearance="outline"><mat-label>نوع فاکتور</mat-label><mat-select [(ngModel)]="type"><mat-option [value]="0">همه</mat-option><mat-option [value]="1">فروش</mat-option><mat-option [value]="2">خرید</mat-option><mat-option [value]="3">برگشت از فروش</mat-option><mat-option [value]="4">برگشت از خرید</mat-option></mat-select></mat-form-field>
      <app-persian-date-field label="از تاریخ" mode="date" [(ngModel)]="dateFrom"></app-persian-date-field>
      <app-persian-date-field label="تا تاریخ" mode="date" [(ngModel)]="dateTo"></app-persian-date-field>

</app-filter-panel>

    <div class="totals" *ngIf="totals">تعداد فاکتورها: {{recordCount | persian}} · جمع نتایج ریالی: {{totals.filteredTotalGross | persian}} ریال · قبل از مالیات: {{totals.filteredTotalNet | persian}} ریال</div>
    <p>برای دیدن آمار خرید، نوع «خرید» و بازهٔ تاریخ را انتخاب کنید. جمع بالا مربوط به همهٔ نتایج فیلترشده است.</p>
    <div class="grid-heading"><h2>فاکتورها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
<ag-grid-angular class="app-data-grid"
      #grid="appPagedGrid"
      [columnDefs]="colDefs"
      [sortWhitelist]="sortWhitelist"
      [appPagedGrid]="fetcher"></ag-grid-angular>
<app-grid-paginator [grid]="grid"></app-grid-paginator>
  `,
  styles: [`
    .totals {padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-weight:600}
    .toolbar {flex-wrap:wrap;gap:12px; display:flex; align-items:center; padding:8px 0; }
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
export class InvoicesPageComponent {
  sortWhitelist = ['dateUtc', 'totalNet', 'totalVat', 'totalGross', 'invoiceNumber'];
  type = 0; dateFrom: string | null = null; dateTo: string | null = null;
  totals: {filteredTotalGross:string;filteredTotalNet:string} | null = null; recordCount=0;
  branchId: number | null = null;
  branches: BranchListItemDto[] = [];

  colDefs: ColDef<InvoiceListItemDto>[] = [
    // ID
    { field: 'id', headerName: 'شناسه', sortable: true, maxWidth: 80, pinned: 'right' },

    // Invoice Info
    { field: 'invoiceNumber', headerName: 'شماره فاکتور', sortable: true, minWidth: 140, pinned: 'right' },
    {
      field: 'type',
      headerName: 'نوع',
      sortable: true,
      maxWidth: 120,
      valueFormatter: p => {
        const typeMap: Record<number, string> = {
          1: 'فروش',
          2: 'خرید',
          3: 'برگشت از فروش',
          4: 'برگشت از خرید'
        };
        return typeMap[p.value as number] || p.value;
      }
    },
    {
      field: 'dateUtc',
      headerName: 'تاریخ',
      sortable: true,
      minWidth: 120,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : ''
    },

    // Contact Info
    { field: 'contactId', headerName: 'شناسه طرف حساب', sortable: false, maxWidth: 90 },
    { field: 'contactCode', headerName: 'کد طرف حساب', sortable: false, minWidth: 100 },
    { field: 'contactName', headerName: 'نام طرف حساب', sortable: false, minWidth: 200 },

    // Branch Info
    { field: 'branchId', headerName: 'شناسه شعبه', sortable: false, maxWidth: 90 },
    { field: 'branchCode', headerName: 'کد شعبه', sortable: false, minWidth: 100 },
    { field: 'branchName', headerName: 'نام شعبه', sortable: false, minWidth: 150 },

    // Financial Info
    { field: 'currency', headerName: 'واحد پول', sortable: false, maxWidth: 100 },
    { field: 'totalNet', headerName: 'جمع خالص', sortable: true, type: 'rightAligned', minWidth: 130 },
    { field: 'totalVat', headerName: 'جمع مالیات بر ارزش افزوده', sortable: true, type: 'rightAligned', minWidth: 130 },
    { field: 'totalGross', headerName: 'مبلغ نهایی', sortable: true, type: 'rightAligned', minWidth: 140 },
    { field: 'balance', headerName: 'مانده', sortable: true, type: 'rightAligned', minWidth: 120 },

    // Audit Info
    {
      field: 'createdAtUtc',
      headerName: 'زمان ایجاد',
      sortable: false,
      minWidth: 150,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleString('fa-IR') : ''
    },
    {
      field: 'updatedAtUtc',
      headerName: 'آخرین تغییر',
      sortable: false,
      minWidth: 150,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleString('fa-IR') : ''
    },

    // Actions (pinned right)
    {
      headerName: '',
      colId: 'actions',
      width: 170,
      pinned: 'left',
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: InvoiceActionsCell
    }
  ];

  @ViewChild('grid') grid!: PagedGridDirective<InvoiceListItemDto>;

  constructor(
    private service: InvoicesService,
    private branchesService: BranchesService,
    private permissionService: PermissionService
  ) {
    if (this.permissionService.has('Branch.Read')) {
      this.branchesService.list().subscribe({
        next: (res) => (this.branches = res),
        error: () => {
          this.branches = [];
        }
      });
    }
  }

  get canEditPrintLayouts() { return this.permissionService.has('CompanySettings.Read') && this.permissionService.has('CompanySettings.Update'); }

  // fetcher fonksiyonu Input olarak veriyoruz
  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string; }) => {
    const query = {
      ...q,
      type:this.type, dateFromUtc:this.dateFrom ? new Date(`${this.dateFrom}T00:00:00`).toISOString() : null,
      dateToUtc:this.dateTo ? new Date(`${this.dateTo}T23:59:59.999`).toISOString() : null,
      branchId: this.branchId ?? undefined
    };
    return this.service.list(query).pipe(tap(r=>{this.totals=r.totals;this.recordCount=r.total;}));
  }

  apply() {
    this.grid.reload();
  }

  reset() {
    this.type=0;this.dateFrom=null;this.dateTo=null;this.branchId = null;
    this.grid.reload();
  }

}
