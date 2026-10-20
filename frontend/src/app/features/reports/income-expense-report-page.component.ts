import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsService } from '../../core/services/reports.service';
import { BranchesService } from '../../core/services/branches.service';
import { AuthService } from '../../core/services/auth.service';
import { IncomeExpenseDto } from '../../core/models/report.models';
import { BranchListItemDto } from '../../core/models/branch.models';

@Component({
  standalone: true,
  selector: 'app-income-expense-report-page',
  imports: [FilterPanelComponent, PersianDateFieldComponent,
    CommonModule, FormsModule, MatCardModule, ...APP_ICON_IMPORTS, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="toolbar">
      <span class="title">گزارش درآمد و هزینه</span>
    </div>

    <p class="disclaimer">
      <mat-icon [svgIcon]="'info'"></mat-icon>
      این گزارش فقط اسناد ریالی را شامل می‌شود و بر مبنای نقدی است و سود حسابداری را نشان نمی‌دهد. خرید موجودی به‌عنوان مخارج انبار در دوره ثبت می‌شود، نه بهای تمام‌شدهٔ کالای فروش‌رفته.
    </p>

    <app-filter-panel title="فیلتر گزارش" [applyDisabled]="loading" [resetDisabled]="loading" (apply)="load()" (reset)="resetFilters()">
@if (showBranchSelector) {
        <mat-form-field appearance="outline" class="branch-field">
          <mat-label>شعبه</mat-label>
          <mat-select [(ngModel)]="branchId">
            <mat-option [value]="null">همه شعبه‌ها</mat-option>
            @for (b of branches; track b.id) {
              <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <app-persian-date-field label="از تاریخ" mode="date" [(ngModel)]="fromDate"></app-persian-date-field>
      <app-persian-date-field label="تا تاریخ" mode="date" [(ngModel)]="toDate"></app-persian-date-field>

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
    } @else if (data) {
      <div class="summary-grid">
        <mat-card class="summary-card">
          <mat-icon class="summary-icon income" [svgIcon]="'trending_up'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">فروش خالص</span>
            <span class="summary-value">{{ formatAmount(data.income) }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <mat-icon class="summary-icon purchases" [svgIcon]="'inventory_2'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">خرید موجودی</span>
            <span class="summary-value">{{ formatAmount(data.inventoryPurchases) }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <mat-icon class="summary-icon expenses" [svgIcon]="'receipt_long'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">هزینه‌های عملیاتی</span>
            <span class="summary-value">{{ formatAmount(data.operatingExpenses) }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <mat-icon class="summary-icon vat" [svgIcon]="'receipt'"></mat-icon>
          <div class="summary-body">
            <span class="summary-label">مانده مالیات بر ارزش افزوده</span>
            <span class="summary-value" [class.negative]="isNegative(data.vatBalance)">{{ formatAmount(data.vatBalance) }}</span>
          </div>
        </mat-card>
      </div>

      <div class="totals-grid">
        <mat-card class="total-card" [class.negative]="isNegative(data.grossProfit)">
          <mat-card-content>
            <span class="total-label">سود ناخالص</span>
            <span class="total-value">{{ formatAmount(data.grossProfit) }}</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="total-card" [class.negative]="isNegative(data.netProfit)">
          <mat-card-content>
            <span class="total-label">سود / زیان خالص</span>
            <span class="total-value">{{ formatAmount(data.netProfit) }}</span>
          </mat-card-content>
        </mat-card>
      </div>
    } @else {
      <p class="empty">بازهٔ تاریخ را انتخاب و روی «اعمال فیلتر» کلیک کنید.</p>
    }
  `,
  styles: [`
    .toolbar { display:flex; align-items:center; padding:8px 0; }
    .title { font-weight:600; font-size:20px; }

    .disclaimer {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-secondary-container); border-radius: 6px;
      padding: 8px 12px; margin: 8px 0 16px; max-width: 780px;
    }
    .disclaimer mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--mat-sys-primary); flex-shrink: 0; }

    
    

    .loading { display:flex; justify-content:center; padding: 48px 0; }
    .empty { color: var(--mat-sys-on-surface-variant); }
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
      margin: 16px 0;
    }
    .summary-card {
      flex-direction: row;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
    }
    .summary-icon {
      width: 44px; height: 44px; font-size: 44px;
      opacity: 0.85;
    }
    .summary-icon.income { color: var(--mat-sys-primary); }
    .summary-icon.purchases { color: var(--mat-sys-primary); }
    .summary-icon.expenses { color: var(--mat-sys-error); }
    .summary-icon.vat { color: var(--mat-sys-primary); }
    .summary-body { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 13px; color: var(--mat-sys-on-surface-variant); }
    .summary-value { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .summary-value.negative { color: var(--mat-sys-error); }

    .totals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      max-width: 600px;
    }
    .total-card { background: var(--mat-sys-primary-container); }
    .total-card.negative { background: var(--mat-sys-error-container); }
    .total-card mat-card-content { display: flex; flex-direction: column; gap: 6px; padding: 8px 4px; }
    .total-label { font-size: 14px; color: var(--mat-sys-on-surface-variant); }
    .total-value { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .total-card.negative .total-value { color: var(--mat-sys-error); }
    .total-card:not(.negative) .total-value { color: var(--mat-sys-primary); }
  `]
})
export class IncomeExpenseReportPageComponent implements OnInit {
  branches: BranchListItemDto[] = [];
  branchId: number | null = null;
  fromDate: string | null = null;
  toDate: string | null = null;
  showBranchSelector = false;

  data: IncomeExpenseDto | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private reportsService: ReportsService,
    private branchesService: BranchesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.showBranchSelector = !!user && (user.role === 'Admin' || user.isHeadquarters);

    if (this.showBranchSelector) {
      this.branchesService.list().subscribe(branches => {
        this.branches = branches;
      });
    } else {
      this.branchId = user?.branchId ?? null;
    }
  }

  resetFilters():void { this.fromDate=null;this.toDate=null;this.branchId=this.showBranchSelector?null:this.authService.currentUser()?.branchId??null;this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.reportsService.getIncomeExpense(this.branchId, this.toIsoStart(this.fromDate), this.toIsoEnd(this.toDate)).subscribe({
      next: res => {
        this.data = res;
        this.loading = false;
      },
      error: () => {
        this.data = null;
        this.loading = false;
        this.error = 'بارگذاری گزارش درآمد و هزینه ناموفق بود.';
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

  private toIsoStart(dateStr: string | null): string | null {
    return dateStr ? new Date(dateStr + 'T00:00:00').toISOString() : null;
  }

  private toIsoEnd(dateStr: string | null): string | null {
    return dateStr ? new Date(dateStr + 'T23:59:59').toISOString() : null;
  }
}
