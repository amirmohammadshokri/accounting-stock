import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { DashboardShortcutsComponent } from './dashboard-shortcuts.component';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { formatPersianDate } from '../../core/utils/persian.utils';
import { PersianPipe } from '../../shared/persian.pipe';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ReportsService } from '../../core/services/reports.service';
import { BranchesService } from '../../core/services/branches.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStatsDto } from '../../core/models/report.models';
import { BranchListItemDto } from '../../core/models/branch.models';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [FilterPanelComponent, DashboardShortcutsComponent, AgGridAngular,
    CommonModule, FormsModule, MatCardModule, ...APP_ICON_IMPORTS,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatButtonModule
  ],
  template: `
    <header class="dashboard-intro"><div><span class="eyebrow">نمای کلی کسب‌وکار</span><h1>داشبورد مالی</h1><p>شاخص‌ها بر مبنای ریال هستند؛ ارز حساب‌های قدیمی در جدول حفظ شده است.</p></div><div class="intro-icon"><mat-icon [svgIcon]="'insights'"></mat-icon></div></header>
    <app-dashboard-shortcuts />
    <app-filter-panel title="خلاصه امروز" hint="با انتخاب شعبه، خلاصه اطلاعات همان شعبه نمایش داده می‌شود." [showApply]="false" [showReset]="false">
      <button filterExtraActions type="button" mat-stroked-button (click)="load()" [disabled]="loading"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button>
      @if (showBranchSelector) {
        <mat-form-field appearance="outline" class="branch-field">
          <mat-label>شعبه</mat-label>
          <mat-select [(ngModel)]="branchId" (selectionChange)="load()">
            @for (b of branches; track b.id) {
              <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    </app-filter-panel>

    @if (loading) {
      <div class="loading">
        <mat-spinner diameter="36"></mat-spinner>
      </div>
    } @else if (error) {
      <div class="error-state">
        <mat-icon [svgIcon]="'error_outline'"></mat-icon>
        <span>{{ error }}</span>
        <button mat-button (click)="load()">تلاش دوباره</button>
      </div>
    } @else if (stats) {
      <div class="summary-grid">
        <mat-card class="summary-card"><mat-icon class="summary-icon sales" [svgIcon]="'shopping_basket'"></mat-icon><div class="summary-body"><span class="summary-label">خرید روزانه</span><span class="summary-value">{{formatAmount(stats.dailyPurchasesTotal || '0')}}</span><span class="currency-unit">ریال</span></div></mat-card>
        <mat-card class="summary-card">
          <mat-icon class="summary-icon sales" [svgIcon]="'point_of_sale'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">فروش روزانه</span>
            <span class="summary-value">{{ formatAmount(stats.dailySalesTotal) }}</span><span class="currency-unit">ریال</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <mat-icon class="summary-icon collections" [svgIcon]="'payments'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">دریافت روزانه</span>
            <span class="summary-value">{{ formatAmount(stats.dailyCollectionsTotal) }}</span><span class="currency-unit">ریال</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <mat-icon class="summary-icon receivables" [svgIcon]="'trending_up'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">طلب شما از طرف حساب‌ها</span>
            <span class="summary-value">{{ formatAmount(stats.totalReceivables) }}</span><span class="currency-unit">ریال</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <mat-icon class="summary-icon payables" [svgIcon]="'trending_down'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">بدهی شما به طرف حساب‌ها</span>
            <span class="summary-value">{{ formatAmount(stats.totalPayables) }}</span><span class="currency-unit">ریال</span>
          </div>
        </mat-card>
      </div>

      <mat-card class="cash-card">
        <mat-card-header>
          <mat-card-title>وضعیت صندوق و بانک</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (stats.cashStatus.length === 0) {
            <p class="empty">حساب صندوق / بانکی برای این شعبه وجود ندارد.</p>
          } @else {
            <ag-grid-angular class="app-data-grid" [rowData]="stats.cashStatus" [columnDefs]="cashColumns" [pagination]="true" [paginationPageSize]="10" [paginationPageSizeSelector]="[10, 25, 50]" [defaultColDef]="{ resizable: true, sortable: true, minWidth: 120 }"></ag-grid-angular>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .dashboard-intro { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 28px 32px; margin-bottom: 20px; border-radius: 24px; color: var(--mat-sys-on-primary-container); background: linear-gradient(115deg, var(--mat-sys-primary-container), var(--mat-sys-surface-container-low)); border: 1px solid var(--mat-sys-outline-variant); }
    .dashboard-intro h1 { margin: 8px 0; font: var(--mat-sys-headline-medium); font-weight: 700; }
    .dashboard-intro p { margin: 0; color: var(--mat-sys-on-surface-variant); }
    .eyebrow { font: var(--mat-sys-label-large); color: var(--mat-sys-primary); }
    .intro-icon { display: grid; place-items: center; width: 80px; height: 80px; border-radius: 24px; background: var(--mat-sys-primary-container); color: var(--mat-sys-primary); }
    .intro-icon mat-icon { width: 44px; height: 44px; font-size: 44px; }
    .summary-card { flex-direction: row; border-inline-start: 4px solid var(--mat-sys-primary); background: var(--mat-sys-surface-container-low); padding: 24px !important; }
    .summary-icon { padding: 12px; width: 56px !important; height: 56px !important; font-size: 32px !important; border-radius: 16px; background: var(--mat-sys-primary-container); }
    .currency-unit { font: var(--mat-sys-label-medium); color: var(--mat-sys-on-surface-variant); }
    @media (max-width: 600px) { .dashboard-intro { padding: 20px; } .intro-icon { display: none; } }

    .toolbar { display:flex; align-items:center; padding:8px 0 16px; }
    .title { font-weight:600; font-size:20px; }
    .spacer { flex:1; }
    

    .loading { display:flex; justify-content:center; padding: 48px 0; }
    .error-state {
      display:flex; align-items:center; gap:10px;
      padding: 16px; border-radius: 8px; max-width: 600px;
      background: var(--mat-sys-error-container); color: var(--mat-sys-error);
    }
    .error-state span { flex:1; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .summary-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
    }
    .summary-icon {
      width: 44px; height: 44px; font-size: 44px;
      opacity: 0.85;
    }
    .summary-icon.sales { color: var(--mat-sys-primary); }
    .summary-icon.collections { color: var(--mat-sys-primary); }
    .summary-icon.receivables { color: var(--mat-sys-primary); }
    .summary-icon.payables { color: var(--mat-sys-error); }
    .summary-body { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 13px; color: var(--mat-sys-on-surface-variant); }
    .summary-value { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }

    .cash-card { width: 100%; }
    .cash-table { width: 100%; border-collapse: collapse; }
    .cash-table th { text-align: start; font-size: 12px; color: var(--mat-sys-on-surface-variant); font-weight: 500; padding: 8px 12px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .cash-table td { padding: 8px 12px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .amount-col { text-align: start; font-variant-numeric: tabular-nums; }
    .amount-col.negative { color: var(--mat-sys-error); }
    .empty { color: var(--mat-sys-on-surface-variant); }
  `]
})
export class DashboardPageComponent implements OnInit {
  cashColumns: ColDef[] = [
{ field: 'name', headerName: 'حساب', flex: 1, minWidth: 180 },
 { field: 'type', headerName: 'نوع', valueFormatter: p => new PersianPipe().transform(p.value, 'type'), minWidth: 120 },
 { field: 'balance', headerName: 'مانده', type: 'rightAligned', minWidth: 180, cellClassRules: { 'negative-value': p => Number(p.value) < 0 } },
 { field: 'currency', headerName: 'واحد پول', minWidth: 140 }
  ];
  branches: BranchListItemDto[] = [];
  branchId: number | null = null;
  stats: DashboardStatsDto | null = null;
  loading = false;
  error: string | null = null;
  showBranchSelector = false;

  constructor(
    private reportsService: ReportsService,
    private branchesService: BranchesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.showBranchSelector = !!user && (user.role === 'Admin' || user.isHeadquarters);

    this.branchesService.list().subscribe(branches => {
      this.branches = branches;
      this.branchId = user?.branchId ?? branches[0]?.id ?? null;
      this.load();
    });
  }

  load(): void {
    if (this.branchId == null) return;
    this.loading = true;
    this.error = null;
    this.reportsService.getDashboard(this.branchId).subscribe({
      next: stats => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.stats = null;
        this.loading = false;
        this.error = 'بارگذاری اطلاعات داشبورد ناموفق بود.';
      }
    });
  }

  formatAmount(value: string): string {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  isNegative(value: string): boolean {
    return Number(value) < 0;
  }
}
