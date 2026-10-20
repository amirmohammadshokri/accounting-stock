import Decimal from 'decimal.js';
import { MealPackageRow } from '../../core/services/meal-packages.service';
import { MealPackagePanelComponent } from '../../shared/meal-package-panel/meal-package-panel.component';
import { latinDigits } from '../../core/utils/persian.utils';
import { PersianPipe } from '../../shared/persian.pipe';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, Input, Output, EventEmitter, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl, FormGroup } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDividerModule } from '@angular/material/divider';

import { AgGridAngular } from 'ag-grid-angular';
import type {
  ColDef, GetRowIdParams, ValueParserParams, CellClickedEvent
} from 'ag-grid-community';
import { AG_THEME } from '../../core/ag-grid/ag-theme';

import { LineActionsCell } from './line-actions.cell';
// money.utils.ts, decimal.js'i backend'in MidpointRounding.AwayFromZero'suna eşdeğer
// (precision 28, ROUND_HALF_UP) şekilde global olarak yapılandırıyor — modül import
// edildiğinde bu ayar zaten uygulanıyor, burada tekrar Decimal.set() çağırmaya gerek yok.
import { calculateInvoiceLine } from '../../core/utils/money.utils';
import { EntityPickerComponent, LookupConfig, PickerOption } from '../../shared/entity-picker/entity-picker.component';
import {
  CONTACT_LOOKUP_COLUMNS, CONTACT_LOOKUP_SORT_WHITELIST, contactToOption,
  ITEM_LOOKUP_COLUMNS, ITEM_LOOKUP_SORT_WHITELIST, itemToOption
} from '../../shared/entity-picker/lookup-configs';
import { ContactsService } from '../../core/services/contacts.service';
import { ContactListItemDto } from '../../core/models/contact.models';
import { ItemsService } from '../../core/services/items.service';
import { ItemListItemDto } from '../../core/models/item.models';
import { DocumentType, DocumentTypeNames } from '../../core/models/invoice.models';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type InvoiceMode = 'insert' | 'update' | 'view';
export type InvoiceTypeStr = 'Sales' | 'Purchase' | 'SalesReturn' | 'PurchaseReturn';

export interface EditLine {
  id?: number;
  itemId: number | null;
  itemCode?: string | null;
  itemName?: string | null;
  unit?: string | null;
  qty: string | null;
  unitPrice: string | null;
  vatRate: number | null;
  discountRate?: string | null;
  withholdingRate?: number | null;
  net?: string | null; vat?: string | null; grandTotal?: string | null;
}

export interface InvoiceFormValue {
  id?: number;
  rowVersionBase64?: string;
  branchId?: number | null;
  branchCode?: string | null;         // salt görüntüleme — backend BranchId'yi çağıranın kendi şubesinden alır
  branchName?: string | null;
  contactId: number | null;
  contactCode?: string | null;        // entity-picker'ın edit/view modunda başlangıç etiketi için
  contactName?: string | null;
  dateUtc: string;
  currency: string;
  type: InvoiceTypeStr | number;
  documentType?: number | null;
  waybillNumber?: string | null;
  waybillDateUtc?: string | null;
  paymentDueDateUtc?: string | null;
  notes?: string | null;
  lines: EditLine[];
}

/* ---- Tipli ana form (sadece header) ---- */
type InvoiceFormGroup = FormGroup<{
  notes: FormControl<string | null>;
  rowVersionBase64: FormControl<string>;
  contactId: FormControl<number | null>;
  dateUtc: FormControl<string>;
  currency: FormControl<string>;
  type: FormControl<InvoiceTypeStr>;
  documentType: FormControl<number | null>;
  waybillNumber: FormControl<string | null>;
  waybillDateUtc: FormControl<string | null>;
  paymentDueDateUtc: FormControl<string | null>;
  // Satırları formda değil grid’de tutuyoruz; save’de map’liyoruz
}>;

type LineRow = {
  id: number;            // 0 = yeni
  _cid?: string;         // client-temp id (rowId için)
  itemId: number | null;
  itemCode?: string | null;
  itemName?: string | null;
  unit?: string | null;
  qty: string | null;        // ⬅️ number yerine string
  unitPrice: string | null;  // ⬅️ number yerine string
  vatRate: number | null;
  discountRate: string | null;
  withholdingRate: number | null;
  net?: string | null;
  vat?: string | null;
  grandTotal?: string | null;
};

@Component({
  standalone: true,
  selector: 'app-invoice-form',
  imports: [PersianPipe, PersianDateFieldComponent,
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatDividerModule,
    AgGridAngular, EntityPickerComponent, MealPackagePanelComponent
  ],
  template: `
  <form class="page" [formGroup]="form" (ngSubmit)="onSave()">
    <!-- ÜST TOOLBAR -->
    <div class="toolbar">
      <h2 class="title">
        {{ mode === 'insert' ? 'فاکتور جدید' :
           mode === 'update' ? 'ویرایش فاکتور' : 'فاکتور' }}
      </h2>
      <span class="spacer"></span>
      <button *ngIf="!readonly()" mat-flat-button color="primary" type="submit">
        <mat-icon [svgIcon]="'save'"></mat-icon>
        ذخیره
      </button>
    </div>

    <div class="branch-info" *ngIf="branchCode">شعبه: {{ branchCode }} - {{ branchName }}</div>
    <div class="branch-info hint" *ngIf="mode === 'insert'">هنگام ذخیره، شعبهٔ کاربر واردشده ثبت می‌شود.</div>

    <!-- HEADER -->
    <div class="form-grid">
      <app-entity-picker
        label="طرف حساب"
        [fetcher]="contactFetcher"
        [lookup]="contactLookup"
        [value]="form.value.contactId ?? null"
        [initialLabel]="contactLabel"
        [width]="'100%'"
        (valueChange)="onContactSelected($event)">
      </app-entity-picker>

      <app-persian-date-field label="تاریخ و ساعت" mode="datetime" formControlName="dateUtc" [readonly]="readonly()"></app-persian-date-field>

      <mat-form-field appearance="outline">
        <mat-label>واحد پول</mat-label>
        <input matInput readonly [value]="form.controls.currency.value | persian:'currency'">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>نوع</mat-label>
        <mat-select formControlName="type" [disabled]="readonly()">
          <mat-option value="Sales">فروش</mat-option>
          <mat-option value="Purchase">خرید</mat-option>
          <mat-option value="SalesReturn">برگشت از فروش</mat-option>
          <mat-option value="PurchaseReturn">برگشت از خرید</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field *ngIf="advanced" appearance="outline">
        <mat-label>نوع سند</mat-label>
        <mat-select formControlName="documentType" [disabled]="readonly()">
          <mat-option [value]="null">—</mat-option>
          <mat-option [value]="DocumentType.Invoice">{{ DocumentTypeNames[DocumentType.Invoice] }}</mat-option>
          <mat-option [value]="DocumentType.RetailReceipt">{{ DocumentTypeNames[DocumentType.RetailReceipt] }}</mat-option>
          <mat-option [value]="DocumentType.ExpenseNote">{{ DocumentTypeNames[DocumentType.ExpenseNote] }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field *ngIf="advanced" appearance="outline">
        <mat-label>شماره حواله</mat-label>
        <input matInput formControlName="waybillNumber" [readonly]="readonly()">
      </mat-form-field>

      <app-persian-date-field *ngIf="advanced" label="تاریخ حواله" mode="date" formControlName="waybillDateUtc" [readonly]="readonly()"></app-persian-date-field>

      <app-persian-date-field label="تاریخ سررسید" mode="date" formControlName="paymentDueDateUtc" [readonly]="readonly()"></app-persian-date-field>
    </div>

    <mat-form-field appearance="outline">
      <mat-label>توضیحات این فاکتور (در پایین چاپ نمایش داده می‌شود)</mat-label>
      <textarea matInput formControlName="notes" rows="2" maxlength="2000" [readonly]="readonly()"></textarea>
    </mat-form-field>
    <mat-divider></mat-divider>
    <app-meal-package-panel *ngIf="!readonly() && packagesAllowed" [readRows]="readPackageRows" (addRows)="appendPackage($event)"></app-meal-package-panel>
    <div class="package-tools" *ngIf="!readonly()">
      <mat-form-field appearance="outline"><mat-label>تعداد برای همهٔ ردیف‌ها</mat-label><input matInput #bulkQty inputmode="decimal"></mat-form-field>
      <button mat-stroked-button type="button" (click)="applyAll('qty', bulkQty.value)">اعمال تعداد</button>
      <mat-form-field appearance="outline"><mat-label>تخفیف همهٔ ردیف‌ها (٪)</mat-label><input matInput #bulkDiscount inputmode="decimal"></mat-form-field>
      <button mat-stroked-button type="button" (click)="applyAll('discountRate', bulkDiscount.value)">اعمال تخفیف</button>
      <button mat-button type="button" (click)="advanced = !advanced; toggleColumns()">{{advanced ? 'نمای ساده' : 'گزینه‌های بیشتر'}}</button>
    </div>

    <!-- SATIRLAR (AG GRID) -->
    <div class="lines-head">
      <h3>ردیف‌ها ({{ rowData.length | persian }})</h3>
      <span class="spacer"></span>
      <app-entity-picker
        *ngIf="!readonly()"
        label="افزودن غذا یا خدمت"
        placeholder="نام غذا یا خدمت را بنویسید…"
        [fetcher]="itemFetcher"
        [lookup]="itemLookup"
        [width]="'320px'"
        [clearOnSelect]="true" (valueChange)="onItemPicked($event)">
      </app-entity-picker>

    </div>

    <div class="lines-error" *ngIf="formError()">{{ formError() }}</div>

    <div class="lines-grid" style="height: 360px; width: 100%;">
      <ag-grid-angular
        [theme]="AG_THEME"
        (cellValueChanged)="refreshTotals()"
        [rowData]="rowData"
        [columnDefs]="colDefs"
        [defaultColDef]="defaultColDef"
        [getRowId]="getRowId"
        [gridOptions]="lineGridOptions"
        (cellClicked)="onCellClicked($event)">
      </ag-grid-angular>
    </div>

    <div class="invoice-total">مبلغ نهایی: {{total | persian}} ریال</div>
    <!-- ALT KAYDET -->
    <div class="foot" *ngIf="!readonly()">
      <span class="spacer"></span>
      <button mat-flat-button color="primary" type="submit">
        <mat-icon [svgIcon]="'save'"></mat-icon> ذخیره
      </button>
    </div>
  </form>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; gap:16px; padding-bottom:16px; }
    .toolbar, .lines-head, .foot { display:flex; align-items:center; gap:12px; }
    .title { margin:0; font-weight:600; }
    .spacer { flex:1; }
    .form-grid {
      display:grid; gap:12px;
      grid-template-columns: repeat(4, minmax(180px, 1fr));
    }
    .package-panel { padding:16px; border:1px solid #cbd5e1; border-radius:12px; }
    .package-panel h3 {margin:0} .package-panel p {color:#64748b} .package-tools {display:flex;gap:8px;align-items:center;flex-wrap:wrap} .package-tools mat-form-field {width:190px} .invoice-total {font-size:20px;font-weight:700;text-align:left}
    .lines-head {flex-wrap:wrap}
    .lines-grid { margin-top:8px; }
    .branch-info { font-size:0.9em; color: var(--mat-sys-on-surface-variant, #666); }
    .branch-info.hint { font-style: italic; }
    .lines-error { color: var(--mat-sys-error, #b3261e); font-size: 0.9em; }
    @media (max-width: 900px) {
      .form-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class InvoiceFormComponent {
  get packagesAllowed():boolean {return this.form.controls.type.value==='Sales';}
  private pendingItems=new Set<number>();

  advanced=false;
  readPackageRows = ():MealPackageRow[] => {
    this.linesGrid?.api?.stopEditing();const error=this.validateLines();this.formError.set(error);if(error)return [];
    return this.rowData.map(l=>({itemId:l.itemId!,quantity:l.qty!,unitPrice:l.unitPrice!,vatRate:l.vatRate??0,discountRate:l.discountRate??'0',withholdingRate:l.withholdingRate??0}));
  };
  appendPackage(rows:MealPackageRow[]):void {
    if(this.readonly()||!this.packagesAllowed)return;this.linesGrid?.api?.stopEditing();
    const next=this.rowData.map(row=>({...row}));
    try{for(const l of rows){
      const existing=next.find(row=>row.itemId===l.itemId);
      if(existing)existing.qty=new Decimal(existing.qty||'0').plus(l.quantity).toFixed(3);
      else next.push({id:0,_cid:`c${this._cidSeq++}`,itemId:l.itemId,itemCode:l.code,itemName:l.name,unit:l.unit,qty:String(l.quantity),unitPrice:String(l.unitPrice),vatRate:l.vatRate,discountRate:String(l.discountRate),withholdingRate:l.withholdingRate});
    }}catch{this.formError.set('ابتدا تعداد ردیف‌های فعلی را اصلاح کنید.');return;}
    this.rowData=next;this.formError.set(null);this.refreshTotals();
  }
  applyAll(field: 'qty' | 'discountRate', value: string) {
    this.linesGrid?.api?.stopEditing();
    const v = latinDigits(value).replace(',', '.').trim();
    if (!/^\d+(\.\d{1,3})?$/.test(v) || (field==='qty' ? Number(v)<=0 : Number(v)>100)) {
      this.formError.set('مقدار واردشده معتبر نیست.'); return;
    }
    this.rowData = this.rowData.map(l=>({...l,[field]:v})); this.formError.set(null); this.refreshTotals();
  }
  toggleColumns() { this.linesGrid?.api?.setColumnsVisible(['itemCode','vatRate','withholdingRate'], this.advanced); }
  refreshTotals() { this.linesGrid?.api?.refreshCells({force:true}); }
  get total(): string {
    return this.rowData.reduce((sum,l)=> { try { return sum.plus(this.preview(l).grandTotal || 0); } catch {return sum;} },new Decimal(0)).toFixed(2);
  }

  AG_THEME = AG_THEME;
  DocumentType = DocumentType;
  DocumentTypeNames = DocumentTypeNames;
  // bkz. shared/ag-grid/paged-grid.directive.ts'deki aynı isimli alanın yorumu:
  // rAF'a ertelenen ilk-render cellRenderer oluşturmasını senkrona zorluyoruz (line-actions.cell).
  lineGridOptions = { suppressAnimationFrame: true, singleClickEdit: true, stopEditingWhenCellsLoseFocus: true, enableRtl: true };

  private contactsService = inject(ContactsService);
  private itemsService = inject(ItemsService);

  @Input() mode: InvoiceMode = 'insert';

  private _id?: number;
  branchCode: string | null = null;
  branchName: string | null = null;
  contactLabel: string | null = null;

  @Input() set value(v: InvoiceFormValue | null) {
    if (!v) return;
    this._id = v.id;
    this.branchCode = v.branchCode ?? null;
    this.branchName = v.branchName ?? null;
    this.contactLabel = v.contactCode && v.contactName ? `${v.contactCode} - ${v.contactName}` : (v.contactName ?? null);
    // header
    this.form.patchValue({
      rowVersionBase64: v.rowVersionBase64 ?? '',
      contactId: v.contactId ?? null,
      // ⬇️ datetime-local uyumlu yerel string
      dateUtc: this.toLocalInputValue(v.dateUtc),
      currency: v.currency ?? 'IRR',
      // ⬇️ sayı/string → enum adı
      type: this.normalizeType(v.type),
      documentType: v.documentType ?? null,
      waybillNumber: v.waybillNumber ?? null,
      waybillDateUtc: this.toDateInputValue(v.waybillDateUtc),
      notes: v.notes ?? null,
      paymentDueDateUtc: this.toDateInputValue(v.paymentDueDateUtc)
    }, { emitEvent: false });

    // lines → grid rows
    this._cidSeq = 1;
    this.rowData = (v.lines ?? []).map(l => ({
      id: l.id ?? 0,
      _cid: l.id ? undefined : `c${this._cidSeq++}`,
      itemId: l.itemId ?? null,
      itemCode: l.itemCode ?? null,
      itemName: l.itemName ?? null,
      unit: l.unit ?? null,
      qty: l.qty ?? null,
      unitPrice: l.unitPrice ?? null,
      vatRate: l.vatRate ?? null,
      discountRate: l.discountRate ?? null,
      withholdingRate: l.withholdingRate ?? null,
      net: l.net ?? null,
      vat: l.vat ?? null,
      grandTotal: l.grandTotal ?? null
    }));
  }

  @Output() saveInsert = new EventEmitter<Omit<InvoiceFormValue, 'rowVersionBase64' | 'id'>>();
  @Output() saveUpdate = new EventEmitter<InvoiceFormValue>();

  private fb = inject(FormBuilder);
  form: InvoiceFormGroup = this.fb.group({
    notes: this.fb.control<string | null>(null, Validators.maxLength(2000)),
    rowVersionBase64: this.fb.nonNullable.control<string>(''),
    contactId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    dateUtc: this.fb.nonNullable.control<string>(new Date().toISOString(), { validators: [Validators.required] }),
    currency: this.fb.nonNullable.control<string>('IRR', { validators: [Validators.required] }),
    type: this.fb.nonNullable.control<InvoiceTypeStr>('Sales', { validators: [Validators.required] }),
    documentType: this.fb.control<number | null>(null),
    waybillNumber: this.fb.control<string | null>(null),
    waybillDateUtc: this.fb.control<string | null>(null),
    paymentDueDateUtc: this.fb.control<string | null>(null)
  });

  readonly = () => this.mode === 'view';
  formError = signal<string | null>(null);

  // --- Grid state ---
  rowData: LineRow[] = [];
  private _cidSeq = 1;

  contactFetcher = (search: string): Observable<PickerOption[]> =>
    this.contactsService.list({ search: search || null, pageSize: 20 }).pipe(
      map(res => res.items.map(c => ({ id: c.id, label: c.customerNumber ?? c.code, sublabel: c.name })))
    );

  itemFetcher = (search: string): Observable<PickerOption[]> =>
    this.itemsService.list({ search: search || undefined, pageSize: 20 }).pipe(
      map(res => res.items.map(i => ({ id: i.id, label: i.code, sublabel: i.name })))
    );

  contactLookup: LookupConfig<ContactListItemDto> = {
    title: 'انتخاب طرف حساب',
    columns: CONTACT_LOOKUP_COLUMNS,
    sortWhitelist: CONTACT_LOOKUP_SORT_WHITELIST,
    searchPlaceholder: 'با شماره مشتری، نام یا تلفن جستجو کنید…',
    fetcher: (q) => this.contactsService.list(q),
    toOption: contactToOption
  };

  itemLookup: LookupConfig<ItemListItemDto> = {
    title: 'انتخاب کالا',
    columns: ITEM_LOOKUP_COLUMNS,
    sortWhitelist: ITEM_LOOKUP_SORT_WHITELIST,
    searchPlaceholder: 'با کد یا نام جستجو کنید…',
    fetcher: (q) => this.itemsService.list(q),
    toOption: itemToOption
  };

  onContactSelected(id: number | null) {
    if (this.readonly()) return;
    this.form.patchValue({ contactId: id });
  }

  onItemPicked(itemId: number | null) {
    if (!itemId || this.readonly()) return;
    if(this.pendingItems.has(itemId)||this.rowData.some(row=>row.itemId===itemId)){
      this.formError.set('این کالا قبلاً اضافه شده است؛ تعداد همان ردیف را کم یا زیاد کنید.');return;
    }
    this.pendingItems.add(itemId);
    this.itemsService.getById(itemId).subscribe({next:item=>{
      this.pendingItems.delete(itemId);if(this.readonly())return;
      if(this.rowData.some(row=>row.itemId===item.id)){this.formError.set('این کالا قبلاً اضافه شده است؛ تعداد همان ردیف را تغییر دهید.');return;}
      this.rowData = [
        {
          id: 0, _cid: `c${this._cidSeq++}`,
          itemId: item.id, itemCode: item.code, itemName: item.name, unit: item.unitName,
          qty: '1', unitPrice: (this.form.controls.type.value === 'Purchase' ? item.purchasePrice : item.salesPrice) ?? '0', vatRate: item.vatRate,
          discountRate: null, withholdingRate: null,
          net: null, vat: null, grandTotal: null
        },
        ...this.rowData
      ];

      this.formError.set(null);this.refreshTotals();
    },error:()=>{this.pendingItems.delete(itemId);this.formError.set('دریافت کالا ناموفق بود؛ دوباره انتخاب کنید.');}});
  }

  stringNumberParser = (p: ValueParserParams) => {
    if (p.newValue === null || p.newValue === undefined) return null;
    const s = latinDigits(String(p.newValue)).replace(',', '.').trim();
    return s === '' ? null : s;   // ⬅️ hep string döndürüyoruz
  };

  getRowId = (p: GetRowIdParams<LineRow>) => String(p.data?.id && p.data.id > 0 ? p.data.id : p.data?._cid);

  deleteLine = (row: LineRow) => {
    const { id, _cid } = row;
    if (this.readonly()) return;
    this.rowData = this.rowData.filter(r => (r.id && r.id > 0) ? r.id !== id : r._cid !== _cid);
  };

  colDefs: ColDef<LineRow>[] = [
    { hide: true, field: 'itemId', cellEditor: 'agTextCellEditor', valueParser: p => { const n = Number(latinDigits(String(p.newValue))); return Number.isFinite(n) ? n : p.oldValue; }, headerName: 'شناسه کالا', editable: p => !this.readonly(), minWidth: 100, maxWidth: 110 },
    { hide: true, field: 'itemCode', headerName: 'کد', editable: false, minWidth: 90, maxWidth: 110 },
    { field: 'itemName', headerName: 'غذا / خدمت', editable: false, minWidth: 160 },
    { field: 'qty', headerName: 'مقدار', editable: p => !this.readonly(), valueParser: this.stringNumberParser, minWidth: 100, type: 'rightAligned' },
    { field: 'unitPrice', headerName: 'قیمت واحد', editable: p => !this.readonly(), valueParser: this.stringNumberParser, minWidth: 120, type: 'rightAligned' },
    { hide: true, field: 'vatRate', cellEditor: 'agTextCellEditor', valueParser: p => { const n = Number(latinDigits(String(p.newValue))); return Number.isFinite(n) ? n : p.oldValue; }, headerName: 'مالیات بر ارزش افزوده (٪)', editable: p => !this.readonly(), minWidth: 100, type: 'rightAligned' },
    { field: 'discountRate', headerName: 'تخفیف (٪)', editable: p => !this.readonly(), valueParser: this.stringNumberParser, minWidth: 110, type: 'rightAligned' },
    { hide: true, field: 'withholdingRate', cellEditor: 'agTextCellEditor', valueParser: p => { const n = Number(latinDigits(String(p.newValue))); return Number.isFinite(n) ? n : p.oldValue; }, headerName: 'مالیات تکلیفی (٪)', editable: p => !this.readonly(), minWidth: 110, type: 'rightAligned' },
    {
      hide: true, headerName: 'خالص',
      editable: false,
      minWidth: 110,
      type: 'rightAligned',
      valueGetter: (p) => this.readonly() ? (p.data?.net ?? '') : this.preview(p.data).net
    },
    {
      hide: true, headerName: 'مالیات بر ارزش افزوده',
      editable: false,
      minWidth: 100,
      type: 'rightAligned',
      valueGetter: (p) => this.readonly() ? (p.data?.vat ?? '') : this.preview(p.data).vat
    },
    {
      headerName: 'مبلغ نهایی',
      editable: false,
      minWidth: 130,
      type: 'rightAligned',
      valueGetter: (p) => this.readonly() ? (p.data?.grandTotal ?? '') : this.preview(p.data).grandTotal
    },
    {
      headerName: '',
      colId: 'actions',
      width: 64,
      pinned: 'left',
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellRenderer: LineActionsCell,
      cellRendererParams: {
        onDelete: this.deleteLine.bind(this) // Material buton tıklanınca bu fonksiyon çalışır
      }
    }
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: false
  };

  onCellClicked(e: CellClickedEvent<LineRow>) {
    const target = e.event?.target as HTMLElement | null;

    // del butonu ise: submit + bubbling engelle
    if (e.colDef.colId === 'actions' && target && target.closest('.del-btn')) {
      e.event?.preventDefault();
      e.event?.stopPropagation();

      if (this.readonly()) return;

      this.deleteLine(e.data!);
    }
  }

  addLine() {
    if (this.readonly()) return;
    this.rowData = [
      { id: 0, _cid: `c${this._cidSeq++}`, itemId: null, qty: '1', unitPrice: '0', vatRate: 0, discountRate: null, withholdingRate: null, net: null, vat: null, grandTotal: null },
      ...this.rowData
    ];
  }

  private validateLines(): string | null {
    if (this.rowData.length === 0) return 'حداقل یک ردیف اضافه کنید.';
    const ids=this.rowData.filter(row=>row.itemId!=null).map(row=>row.itemId);
    if(new Set(ids).size!==ids.length)return 'هر کالا فقط یک ردیف دارد؛ ردیف تکراری را حذف و تعداد ردیف اصلی را اصلاح کنید.';
    for (const l of this.rowData) {
      if (!l.itemId || l.itemId <= 0) return 'برای هر ردیف یک کالای معتبر انتخاب کنید.';
      if (!l.qty || !Number.isFinite(Number(l.qty)) || Number(l.qty) <= 0) return 'مقدار باید بیشتر از صفر باشد.';
      if (l.unitPrice == null || !Number.isFinite(Number(l.unitPrice)) || Number(l.unitPrice) < 0) return 'قیمت واحد نمی‌تواند منفی باشد.';
      const vat = Number(l.vatRate ?? 0);
      if (!Number.isInteger(vat) || vat < 0 || vat > 100) return 'نرخ مالیات باید بین ۰ تا ۱۰۰ باشد.';
      const disc = l.discountRate != null ? Number(l.discountRate.toString().replace(',', '.')) : 0;
      if (!Number.isFinite(disc) || disc < 0 || disc > 100) return 'نرخ تخفیف باید بین ۰ تا ۱۰۰ باشد.';
      const wh = Number(l.withholdingRate ?? 0);
      if (!Number.isInteger(wh) || wh < 0 || wh > 100) return 'نرخ مالیات تکلیفی باید بین ۰ تا ۱۰۰ باشد.';
    }
    return null;
  }

  @ViewChild(AgGridAngular) private linesGrid?: AgGridAngular;

  onSave() {
    if (this.readonly()) return;
    this.linesGrid?.api?.stopEditing();
    if (this.form.invalid) { this.form.markAllAsTouched(); this.formError.set('طرف حساب، تاریخ و توضیحات را بررسی کنید.'); return; }
    const err = this.validateLines();
    this.formError.set(err);
    if (err) return;

    const h = this.form.getRawValue();

    const normalize = (v: string | null | undefined): string => {
      const s = (v ?? '0').toString().replace(',', '.').trim();
      return s === '' ? '0' : s;
    };

    const waybillDateUtc = this.dateInputToUtcIso(h.waybillDateUtc);
    const paymentDueDateUtc = this.dateInputToUtcIso(h.paymentDueDateUtc);

    const bodyLines = this.rowData.map(l => ({
      id: l.id ?? 0,
      itemId: l.itemId!,
      qty: l.qty ?? '0',
      unitPrice: l.unitPrice ?? '0',
      vatRate: Number(l.vatRate ?? 0),
      discountRate: l.discountRate != null ? normalize(l.discountRate) : null,
      withholdingRate: l.withholdingRate ?? null
    }));

    if (this.mode === 'insert') {
      const createLines = this.rowData.map(l => ({
        id: 0,
        itemId: Number(l.itemId ?? 0),      // ItemId: int (BE dto da int)
        qty: normalize(l.qty),              // ⬅️ string, BE decimal.TryParse
        unitPrice: normalize(l.unitPrice),  // ⬅️ string, BE decimal.TryParse
        vatRate: Number(l.vatRate ?? 0),
        discountRate: l.discountRate != null ? normalize(l.discountRate) : null,
        withholdingRate: l.withholdingRate ?? null
      }));

      this.saveInsert.emit({
        contactId: h.contactId!,
        dateUtc: this.localToUtcIso(h.dateUtc),
        currency: h.currency,
        type: this.typeToNumber(h.type),
        notes: h.notes,
        documentType: h.documentType,
        waybillNumber: h.waybillNumber || null,
        waybillDateUtc,
        paymentDueDateUtc,
        lines: createLines as any
      } as any);
    } else {
      this.saveUpdate.emit({
        id: this._id!,
        rowVersionBase64: h.rowVersionBase64,
        contactId: h.contactId!,
        dateUtc: this.localToUtcIso(h.dateUtc),
        currency: h.currency,
        type: this.typeToNumber(h.type),
        notes: h.notes,
        documentType: h.documentType,
        waybillNumber: h.waybillNumber || null,
        waybillDateUtc,
        paymentDueDateUtc,
        lines: bodyLines
      } as any);
    }
  }

  toLocalInputValue(isoUtc?: string): string {
    // BE'den "2025-11-02T16:00:00Z" gelirse -> "2025-11-02T19:00"
    const d = isoUtc ? new Date(isoUtc) : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  localToUtcIso(localStr: string): string {
    // "YYYY-MM-DDTHH:mm" (tz'siz yerel) -> UTC ISO "....Z"
    return new Date(localStr).toISOString();
  }

  toDateInputValue(isoUtc?: string | null): string | null {
    if (!isoUtc) return null;
    // <input type="text" persianDate="date"> "YYYY-MM-DD" bekliyor
    return isoUtc.slice(0, 10);
  }

  dateInputToUtcIso(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    return new Date(`${dateStr}T00:00:00Z`).toISOString();
  }

  // Backend'e InvoiceType her zaman sayı olarak gitmeli (System.Text.Json enum'ları
  // varsayılan olarak sayı bekler, JsonStringEnumConverter kayıtlı değil) — normalizeType'ın
  // tam tersi. Bunsuz form 'Sales' gibi bir string gönderiyordu ve backend bunu
  // InvoiceType'a çeviremediği için hem oluşturma hem güncelleme her zaman 400 dönüyordu.
  private typeToNumber(val: InvoiceTypeStr | number): number {
    if (typeof val === 'number') return val;
    switch (val) {
      case 'Sales': return 1;
      case 'Purchase': return 2;
      case 'SalesReturn': return 3;
      case 'PurchaseReturn': return 4;
      default: return 1;
    }
  }

  normalizeType(val: unknown): InvoiceTypeStr {
    if (typeof val === 'number') {
      switch (val) {
        case 1: return 'Sales';
        case 2: return 'Purchase';
        case 3: return 'SalesReturn';
        case 4: return 'PurchaseReturn';
        default: return 'Sales';
      }
    }
    if (typeof val === 'string') {
      // "1"/"2" string gelirse:
      const n = Number(val);
      if (Number.isFinite(n)) return this.normalizeType(n);
      // "Sales" vb. gelirse:
      if (['Sales', 'Purchase', 'SalesReturn', 'PurchaseReturn'].includes(val)) return val as InvoiceTypeStr;
    }
    return 'Sales';
  }

  private preview(row?: { qty?: string | null; unitPrice?: string | null; vatRate?: number | null; discountRate?: string | null; withholdingRate?: number | null }) {
    const { net, vat, grandTotal } = calculateInvoiceLine({
      qty: row?.qty ?? 0,
      unitPrice: row?.unitPrice ?? 0,
      vatRate: Number(row?.vatRate ?? 0),
      discountRate: row?.discountRate ?? null,
      withholdingRate: row?.withholdingRate ?? null
    });

    return { net, vat, grandTotal };
  }
}
