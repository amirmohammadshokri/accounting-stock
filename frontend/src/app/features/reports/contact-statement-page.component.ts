import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { formatPersianDate } from '../../core/utils/persian.utils';
import { PersianPipe } from '../../shared/persian.pipe';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, map } from 'rxjs';
import { EntityPickerComponent, LookupConfig, PickerOption } from '../../shared/entity-picker/entity-picker.component';
import { CONTACT_LOOKUP_COLUMNS, CONTACT_LOOKUP_SORT_WHITELIST, contactToOption } from '../../shared/entity-picker/lookup-configs';
import { ReportsService } from '../../core/services/reports.service';
import { ContactsService } from '../../core/services/contacts.service';
import { ContactListItemDto } from '../../core/models/contact.models';
import { ContactStatementDto } from '../../core/models/report.models';

@Component({
  standalone: true,
  selector: 'app-contact-statement-page',
  imports: [FilterPanelComponent, AgGridAngular, PersianDateFieldComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    ...APP_ICON_IMPORTS, MatProgressSpinnerModule, EntityPickerComponent
  ],
  template: `
    <div class="toolbar">
      <span class="title">صورت‌حساب طرف حساب</span>
    </div>

    <app-filter-panel title="فیلتر صورت‌حساب" [applyDisabled]="!contactId || loading" [resetDisabled]="loading || exporting" (apply)="load()" (reset)="resetFilters()">
<app-entity-picker
        label="طرف حساب"
        [fetcher]="contactFetcher"
        [lookup]="contactLookup"
        [value]="contactId"
        [width]="'100%'"
        (valueChange)="onContactSelected($event)">
      </app-entity-picker>

      <app-persian-date-field label="از تاریخ" mode="date" [(ngModel)]="fromDate"></app-persian-date-field>
      <app-persian-date-field label="تا تاریخ" mode="date" [(ngModel)]="toDate"></app-persian-date-field>
<button filterExtraActions type="button" mat-stroked-button [disabled]="!contactId || exporting" (click)="export()">
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
        <button mat-button (click)="load()">تلاش دوباره</button>
      </div>
    } @else if (statement) {
      <div class="statement-header">
        <span class="contact-name">{{ statement.contactName }}</span>
        <span class="balance-chip" [class.negative]="isNegative(currentBalance)">
          {{ currentBalanceLabel }}: {{ formatAmount(currentBalance) }} ریال
        </span>
      </div>

      @if (statement.items.length === 0) {
        <p class="empty">در بازهٔ انتخاب‌شده گردشی وجود ندارد.</p>
      } @else {
        <div class="table-wrap">
          <ag-grid-angular class="app-data-grid" [rowData]="statement.items" [columnDefs]="columns" [pagination]="true" [paginationPageSize]="10" [paginationPageSizeSelector]="[10, 25, 50]" [defaultColDef]="{ resizable: true, sortable: true, minWidth: 120 }"></ag-grid-angular>
        </div>
      }
    } @else {
      <p class="empty">برای نمایش صورت‌حساب، طرف حساب را انتخاب و روی «اعمال فیلتر» کلیک کنید.</p>
    }
  `,
  styles: [`
    .toolbar { display:flex; align-items:center; padding:8px 0; }
    .title { font-weight:600; font-size:20px; }
    

    .loading { display:flex; justify-content:center; padding: 48px 0; }
    .empty { color: var(--mat-sys-on-surface-variant); }
    .error-state {
      display:flex; align-items:center; gap:10px;
      padding: 16px; border-radius: 8px; max-width: 600px;
      background: var(--mat-sys-error-container); color: var(--mat-sys-error);
    }
    .error-state span { flex:1; }

    .statement-header { display:flex; align-items:center; gap:16px; padding: 8px 0 16px; }
    .contact-name { font-size: 18px; font-weight: 600; }
    .balance-chip {
      font-weight: 600; font-variant-numeric: tabular-nums;
      padding: 4px 12px; border-radius: 16px;
      background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
    }
    .balance-chip.negative { background: rgba(198,40,40,0.12); color: var(--mat-sys-error); }

    .table-wrap { overflow-x: auto; }
    .statement-table { width: 100%; border-collapse: collapse; min-width: 720px; }
    .statement-table th { text-align: start; font-size: 12px; color: var(--mat-sys-on-surface-variant); font-weight: 500; padding: 8px 12px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .statement-table td { padding: 8px 12px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .statement-table tr.opening { background: rgba(0,0,0,0.03); font-style: italic; }
    .amount-col { text-align: start; font-variant-numeric: tabular-nums; }
    .amount-col.negative { color: var(--mat-sys-error); }
  `]
})
export class ContactStatementPageComponent {
  columns: ColDef[] = [
{ field: 'dateUtc', headerName: 'تاریخ', minWidth: 140, valueFormatter: p => formatPersianDate(p.value) }, { field: 'type', headerName: 'نوع', minWidth: 160, valueFormatter: p => new PersianPipe().transform(p.value, 'type') }, { field: 'documentNo', headerName: 'شماره سند', minWidth: 150 },
 { field: 'description', headerName: 'شرح', flex: 1, minWidth: 200, valueFormatter: p => new PersianPipe().transform(p.value, 'type') },
 { field: 'debt', headerName: 'بدهکار', type: 'rightAligned' }, { field: 'credit', headerName: 'بستانکار', type: 'rightAligned' }, { field: 'balance', headerName: 'مانده', type: 'rightAligned', cellClassRules: { 'negative-value': p => Number(p.value) < 0 } }
  ];
  contactId: number | null = null;
  fromDate: string | null = null;
  toDate: string | null = null;

  statement: ContactStatementDto | null = null;
  loading = false;
  error: string | null = null;
  exporting = false;

  get currentBalanceLabel(): string { const n=Number(this.currentBalance); return n>0 ? 'از این طرف حساب طلب دارید' : n<0 ? 'به این طرف حساب بدهکارید' : 'حساب تسویه است'; }

  get currentBalance(): string {
    if (!this.statement || this.statement.items.length === 0) return '0.00';
    return this.statement.items[this.statement.items.length - 1].balance;
  }

  constructor(
    private reportsService: ReportsService,
    private contactsService: ContactsService,
    private snack: MatSnackBar
  ) {}

  contactFetcher = (search: string): Observable<PickerOption[]> =>
    this.contactsService.list({ search: search || null, pageSize: 20 }).pipe(
      map(res => res.items.map(c => ({ id: c.id, label: c.customerNumber ?? c.code, sublabel: c.name })))
    );

  contactLookup: LookupConfig<ContactListItemDto> = {
    title: 'انتخاب طرف حساب',
    columns: CONTACT_LOOKUP_COLUMNS,
    sortWhitelist: CONTACT_LOOKUP_SORT_WHITELIST,
    searchPlaceholder: 'با شماره مشتری، نام یا تلفن جستجو کنید…',
    fetcher: (q) => this.contactsService.list(q),
    toOption: contactToOption
  };

  onContactSelected(id: number | null) {
    this.contactId = id;
    this.statement = null;
  }

  resetFilters():void { this.contactId=null;this.fromDate=null;this.toDate=null;this.statement=null;this.error=null; }

  load() {
    if (!this.contactId) return;
    this.loading = true;
    this.error = null;
    this.reportsService.getContactStatement(this.contactId, this.toIsoStart(this.fromDate), this.toIsoEnd(this.toDate)).subscribe({
      next: res => {
        this.statement = res;
        this.loading = false;
      },
      error: () => {
        this.statement = null;
        this.loading = false;
        this.error = 'بارگذاری صورت‌حساب ناموفق بود.';
      }
    });
  }

  export() {
    if (!this.contactId) return;
    this.exporting = true;
    this.reportsService.exportContactStatement(this.contactId, this.toIsoStart(this.fromDate), this.toIsoEnd(this.toDate)).subscribe({
      next: blob => {
        const contactName = this.statement?.contactName ?? 'طرف حساب';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `صورت‌حساب_${contactName.replace(/\s+/g, '_')}.xlsx`;
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
