import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { PersianPipe } from '../../shared/persian.pipe';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { formatPersianDate } from '../../core/utils/persian.utils';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportsService } from '../../core/services/reports.service';
import { StockStatusDto } from '../../core/models/report.models';

@Component({
  standalone: true,
  selector: 'app-stock-status-report-page',
  imports: [FilterPanelComponent, AgGridAngular,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatProgressSpinnerModule
  ],
  template: `
    <div class="toolbar">
      <span class="title">گزارش موجودی انبار</span>
      <span class="spacer"></span>
      
    </div>

    <app-filter-panel hint="نتایج هم‌زمان با نوشتن جستجو به‌روز می‌شوند." [showApply]="false" (reset)="search=''">
<mat-form-field appearance="outline" class="search-field">
        <mat-label>جستجو (کد کالا/نام)</mat-label>
        <input matInput [(ngModel)]="search">
      </mat-form-field>

<button filterExtraActions type="button" mat-stroked-button [disabled]="exporting" (click)="export()">
        <mat-icon [svgIcon]="'file_download'"></mat-icon>
        خروجی اکسل
      </button>
</app-filter-panel>

    @if (loading) {
      <div class="loading">
        <mat-spinner diameter="36"></mat-spinner>
      </div>
    } @else if (error) {
      <div class="error-state">
        <mat-icon [svgIcon]="'error_outline'"></mat-icon>
        <span>{{ error }}</span>
        <button mat-button (click)="reload()">تلاش دوباره</button>
      </div>
    } @else if (filteredRows().length === 0) {
      <p class="empty">{{ rows.length === 0 ? 'کالای فعالی وجود ندارد.' : 'کالایی مطابق جستجوی شما یافت نشد.' }}</p>
    } @else {
      <div class="table-wrap">
        <ag-grid-angular class="app-data-grid" [rowData]="filteredRows()" [columnDefs]="columns" [pagination]="true" [paginationPageSize]="10" [paginationPageSizeSelector]="[10, 25, 50]" [defaultColDef]="{ resizable: true, sortable: true, minWidth: 120 }"></ag-grid-angular>
      </div>
    }
  `,
  styles: [`
    .toolbar { display:flex; align-items:center; padding:8px 0; }
    .title { font-weight:600; font-size:20px; }
    .spacer { flex:1; }
    
    

    .loading { display:flex; justify-content:center; padding: 48px 0; }
    .empty { color: var(--mat-sys-on-surface-variant); }
    .error-state {
      display:flex; align-items:center; gap:10px;
      padding: 16px; border-radius: 8px; max-width: 600px;
      background: var(--mat-sys-error-container); color: var(--mat-sys-error);
    }
    .error-state span { flex:1; }

    .table-wrap { overflow-x: auto; }
    .stock-table { width: 100%; border-collapse: collapse; min-width: 640px; }
    .stock-table th { text-align: start; font-size: 12px; color: var(--mat-sys-on-surface-variant); font-weight: 500; padding: 8px 12px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .stock-table td { padding: 8px 12px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .amount-col { text-align: start; font-variant-numeric: tabular-nums; }
    .amount-col.negative { color: var(--mat-sys-error); font-weight: 600; }
  `]
})
export class StockStatusReportPageComponent implements OnInit {
  columns: ColDef[] = [
{ field: 'itemCode', headerName: 'کد کالا', minWidth: 130 }, { field: 'itemName', headerName: 'نام کالا', flex: 1, minWidth: 200 }, { field: 'unit', headerName: 'واحد', minWidth: 100 },
 { field: 'quantityIn', headerName: 'ورودی', type: 'rightAligned' }, { field: 'quantityOut', headerName: 'خروجی', type: 'rightAligned' }, { field: 'quantityReserved', headerName: 'رزرو شده', type: 'rightAligned' }, { field: 'quantityAvailable', headerName: 'موجود', type: 'rightAligned', cellClassRules: { 'negative-value': p => Number(p.value) < 0 } }
  ];
  rows: StockStatusDto[] = [];
  search = '';
  loading = false;
  error: string | null = null;
  exporting = false;

  constructor(
    private reportsService: ReportsService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    this.reportsService.getStockStatus().subscribe({
      next: res => {
        this.rows = res;
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'بارگذاری موجودی انبار ناموفق بود.';
      }
    });
  }

  filteredRows(): StockStatusDto[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.rows;
    return this.rows.filter(r =>
      r.itemCode.toLowerCase().includes(term) || r.itemName.toLowerCase().includes(term)
    );
  }

  export() {
    this.exporting = true;
    this.reportsService.exportStockStatus().subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'StokDurumu.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        this.snack.open('دریافت خروجی اکسل ناموفق بود.', 'بستن', { duration: 3000 });
        this.exporting = false;
      }
    });
  }

  formatQty(value: string): string {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }

  isNegative(value: string): boolean {
    return Number(value) < 0;
  }
}
