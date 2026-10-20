import { MealPackageRow } from '../../core/services/meal-packages.service';
import { MealPackagePanelComponent } from '../../shared/meal-package-panel/meal-package-panel.component';
import { latinDigits } from '../../core/utils/persian.utils';
import { PersianPipe } from '../../shared/persian.pipe';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, Input, Output, EventEmitter, inject, ViewChild, signal } from '@angular/core';
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
import Decimal from 'decimal.js';

import { OrderLineActionsCell } from './order-line-actions.cell';
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
import { OrderType } from '../../core/models/order.models';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type OrderMode = 'insert' | 'update' | 'view';

export interface EditLine {
  id?: number;
  itemId: number | null;
  itemName?: string | null;
  description: string;
  quantity: string | null;
  unitPrice: string | null;
  vatRate: number | null;
  discountRate?: string | null;
  withholdingRate?: number | null;
}

export interface OrderFormValue {
  id?: number;
  rowVersionBase64?: string;
  branchId?: number | null;
  contactId: number | null;
  contactName?: string | null;
  dateUtc: string;
  type: OrderType | number;
  currency: string;
  description?: string | null;
  lines: EditLine[];
}

/* ---- Tipli ana form (sadece header) ---- */
type OrderFormGroup = FormGroup<{
  rowVersionBase64: FormControl<string>;
  contactId: FormControl<number | null>;
  dateUtc: FormControl<string>;
  type: FormControl<number>;
  currency: FormControl<string>;
  description: FormControl<string | null>;
  // Satırları formda değil grid’de tutuyoruz; save’de map’liyoruz
}>;

type LineRow = {
  id: number;            // 0 = yeni
  _cid?: string;         // client-temp id (rowId için)
  itemId: number | null;
  itemName?: string | null;
  description: string | null;
  quantity: string | null;
  unitPrice: string | null;
  vatRate: number | null;
  discountRate?: string | null;
  withholdingRate?: number | null;
};

@Component({
  standalone: true,
  selector: 'app-order-form',
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
        {{ mode === 'insert' ? 'سفارش جدید' :
           mode === 'update' ? 'ویرایش سفارش' : 'سفارش' }}
      </h2>
      <span class="spacer"></span>
      <button *ngIf="!readonly()" mat-flat-button color="primary" type="submit">
        <mat-icon [svgIcon]="'save'"></mat-icon>
        ذخیره
      </button>
    </div>

    <div class="branch-info" *ngIf="branchId">شناسه شعبه: {{ branchId }}</div>
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
        <mat-label>نوع</mat-label>
        <mat-select formControlName="type" [disabled]="readonly() || mode === 'update'">
          <mat-option [value]="OrderType.Sales">فروش</mat-option>
          <mat-option [value]="OrderType.Purchase">خرید</mat-option>
          <mat-option [value]="OrderType.SalesReturn">برگشت از فروش</mat-option>
          <mat-option [value]="OrderType.PurchaseReturn">برگشت از خرید</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>واحد پول</mat-label>
        <input matInput readonly [value]="form.controls.currency.value | persian:'currency'">
      </mat-form-field>

      <mat-form-field appearance="outline" class="desc-field">
        <mat-label>شرح</mat-label>
        <input matInput formControlName="description" [readonly]="readonly()">
      </mat-form-field>
    </div>

    <div class="type-hint" *ngIf="mode === 'update'">نوع و واحد پول پس از ایجاد قابل تغییر نیستند.</div>

    <mat-divider></mat-divider>
    <app-meal-package-panel *ngIf="!readonly() && packagesAllowed" [readRows]="readPackageRows" (addRows)="appendPackage($event)"></app-meal-package-panel>
    <div class="bulk-tools" *ngIf="!readonly()"><mat-form-field appearance="outline"><mat-label>تعداد همهٔ ردیف‌ها</mat-label><input matInput #bulkQty inputmode="decimal"></mat-form-field><button mat-stroked-button type="button" (click)="applyAll('quantity',bulkQty.value)">اعمال تعداد</button><mat-form-field appearance="outline"><mat-label>تخفیف همهٔ ردیف‌ها (٪)</mat-label><input matInput #bulkDiscount inputmode="decimal"></mat-form-field><button mat-stroked-button type="button" (click)="applyAll('discountRate',bulkDiscount.value)">اعمال تخفیف</button><button mat-button type="button" (click)="advanced=!advanced;toggleColumns()">{{advanced ? 'نمای ساده' : 'گزینه‌های بیشتر'}}</button></div>

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
      <button *ngIf="!readonly()" type="button" mat-stroked-button (click)="addLine()">
        <mat-icon [svgIcon]="'add'"></mat-icon> ردیف خالی
      </button>
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

    <div class="order-total">مبلغ نهایی: {{total | persian}} ریال</div>
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
    .desc-field { grid-column: span 2; }
    .bulk-tools {display:flex;flex-wrap:wrap;gap:10px;align-items:center}.bulk-tools mat-form-field{width:180px}.order-total{text-align:left;font-size:20px;font-weight:700}.lines-head{flex-wrap:wrap}
    .lines-grid { margin-top:8px; }
    .branch-info { font-size:0.9em; color: var(--mat-sys-on-surface-variant, #666); }
    .branch-info.hint { font-style: italic; }
    .type-hint { font-size:0.85em; font-style: italic; color: var(--mat-sys-on-surface-variant, #666); }
    .lines-error { color: var(--mat-sys-error, #b3261e); font-size: 0.9em; }
    @media (max-width: 900px) {
      .form-grid { grid-template-columns: repeat(2, 1fr); }
      .desc-field { grid-column: span 2; }
    }
  `]
})
export class OrderFormComponent {
  get packagesAllowed():boolean {return this.form.controls.type.value===OrderType.Sales;}
  private pendingItems=new Set<number>();
  AG_THEME = AG_THEME;
  OrderType = OrderType;
  // bkz. shared/ag-grid/paged-grid.directive.ts'deki aynı isimli alanın yorumu:
  // rAF'a ertelenen ilk-render cellRenderer oluşturmasını senkrona zorluyoruz (line-actions.cell).
  lineGridOptions = { suppressAnimationFrame:true, singleClickEdit:true, stopEditingWhenCellsLoseFocus:true, enableRtl:true };

  private contactsService = inject(ContactsService);
  private itemsService = inject(ItemsService);

  @Input() mode: OrderMode = 'insert';

  private _id?: number;
  branchId: number | null = null;
  contactLabel: string | null = null;

  @Input() set value(v: OrderFormValue | null) {
    if (!v) return;
    this._id = v.id;
    this.branchId = v.branchId ?? null;
    this.contactLabel = v.contactName ?? null;
    // header
    this.form.patchValue({
      rowVersionBase64: v.rowVersionBase64 ?? '',
      contactId: v.contactId ?? null,
      // ⬇️ datetime-local uyumlu yerel string
      dateUtc: this.toLocalInputValue(v.dateUtc),
      type: this.typeToNumber(v.type),
      currency: v.currency ?? 'IRR',
      description: v.description ?? null
    }, { emitEvent: false });

    // lines → grid rows
    this._cidSeq = 1;
    this.rowData = (v.lines ?? []).map(l => ({
      id: l.id ?? 0,
      _cid: l.id ? undefined : `c${this._cidSeq++}`,
      itemId: l.itemId ?? null,
      itemName: l.itemName ?? null,
      description: l.description ?? null,
      quantity: l.quantity ?? null,
      unitPrice: l.unitPrice ?? null,
      discountRate:l.discountRate??null,withholdingRate:l.withholdingRate??0,
      vatRate: l.vatRate ?? null
    }));
  }

  @Output() saveInsert = new EventEmitter<any>();
  @Output() saveUpdate = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  form: OrderFormGroup = this.fb.group({
    rowVersionBase64: this.fb.nonNullable.control<string>(''),
    contactId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    dateUtc: this.fb.nonNullable.control<string>(new Date().toISOString(), { validators: [Validators.required] }),
    type: this.fb.nonNullable.control<number>(OrderType.Sales, { validators: [Validators.required] }),
    currency: this.fb.nonNullable.control<string>('IRR', { validators: [Validators.required] }),
    description: this.fb.control<string | null>(null)
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
    if(this.readonly())return;
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
          itemId: item.id, itemName: item.name,
          description: item.name,
          quantity: '1', unitPrice:(this.form.controls.type.value === OrderType.Purchase ? item.purchasePrice : item.salesPrice) ?? '0', vatRate: item.vatRate
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
    if(this.readonly())return;
    const { id, _cid } = row;
    this.rowData = this.rowData.filter(r => (r.id && r.id > 0) ? r.id !== id : r._cid !== _cid);
  };

  colDefs: ColDef<LineRow>[] = [
    { hide:true, field: 'itemId', cellEditor: 'agTextCellEditor', valueParser: p => { const n = Number(latinDigits(String(p.newValue))); return Number.isFinite(n) ? n : p.oldValue; }, headerName: 'شناسه کالا', editable: p => !this.readonly(), minWidth: 90, maxWidth: 100 },
    { field: 'itemName', headerName: 'غذا / خدمت', editable: false, minWidth: 140 },
    { field: 'description', headerName: 'شرح', editable: p => !this.readonly(), minWidth: 180 },
    { field: 'quantity', headerName: 'مقدار', editable: p => !this.readonly(), valueParser: this.stringNumberParser, minWidth: 100, type: 'rightAligned' },
    { field: 'unitPrice', headerName: 'قیمت واحد', editable: p => !this.readonly(), valueParser: this.stringNumberParser, minWidth: 120, type: 'rightAligned' },
    {field:'discountRate',headerName:'تخفیف (٪)',editable:p=>!this.readonly(),valueParser:this.stringNumberParser,minWidth:100},
    {field:'withholdingRate',headerName:'کسور مالیات (٪)',hide:true,editable:p=>!this.readonly(),valueParser:p=>Number(latinDigits(String(p.newValue))),minWidth:110},
    { hide:true, field: 'vatRate', cellEditor: 'agTextCellEditor', valueParser: p => { const n = Number(latinDigits(String(p.newValue))); return Number.isFinite(n) ? n : p.oldValue; }, headerName: 'مالیات بر ارزش افزوده (٪)', editable: p => !this.readonly(), minWidth: 100, type: 'rightAligned' },
    {
      hide:true, headerName: 'خالص',
      editable: false,
      minWidth: 110,
      type: 'rightAligned',
      valueGetter: (p) => this.preview(p.data).net
    },
    {
      hide:true, headerName: 'مالیات بر ارزش افزوده',
      editable: false,
      minWidth: 100,
      type: 'rightAligned',
      valueGetter: (p) => this.preview(p.data).vat
    },
    {
      headerName: 'مبلغ نهایی',
      editable: false,
      minWidth: 130,
      type: 'rightAligned',
      valueGetter: (p) => this.preview(p.data).gross
    },
    {
      headerName: '',
      colId: 'actions',
      width: 64,
      pinned: 'left',
      suppressHeaderMenuButton: true,
      sortable: false,
      filter: false,
      cellRenderer: OrderLineActionsCell,
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

      const { id, _cid } = e.data!;
      this.rowData = this.rowData.filter(r => (r.id && r.id > 0) ? r.id !== id : r._cid !== _cid);
    }
  }

  addLine() {
    if (this.readonly()) return;
    this.rowData = [
      { id: 0, _cid: `c${this._cidSeq++}`, itemId: null, itemName: null, description: '', quantity: '1', unitPrice: '0', vatRate: 0 },
      ...this.rowData
    ];
  }

  private validateLines(): string | null {
    if (this.rowData.length === 0) return 'حداقل یک قلم سفارش اضافه کنید.';
    const ids=this.rowData.filter(row=>row.itemId!=null).map(row=>row.itemId);if(new Set(ids).size!==ids.length)return 'ردیف کالای تکراری را حذف و تعداد ردیف اصلی را تغییر دهید.';
    for (const l of this.rowData) {
      if (!l.description || !l.description.trim()) return 'شرح هر ردیف را وارد کنید.';
      if (!l.quantity || !Number.isFinite(Number(l.quantity)) || Number(l.quantity) <= 0) return 'مقدار باید بیشتر از صفر باشد.';
      if(l.unitPrice==null || !Number.isFinite(Number(l.unitPrice)) || Number(l.unitPrice)<0) return 'قیمت واحد نمی‌تواند منفی باشد.';
      const vat = Number(l.vatRate ?? 0);
      if(!Number.isInteger(vat)||vat<0||vat>100)return 'درصد مالیات باید بین صفر تا ۱۰۰ باشد.';
      if(!Number.isFinite(Number(l.discountRate??0))||Number(l.discountRate??0)<0||Number(l.discountRate??0)>100)return 'درصد تخفیف معتبر نیست.';
      if(!Number.isInteger(l.withholdingRate??0)||Number(l.withholdingRate??0)<0||Number(l.withholdingRate??0)>100)return 'درصد کسور معتبر نیست.';
    }
    return null;
  }

  onSave() {
    if (this.readonly()) return;
    this.linesGrid?.api?.stopEditing();
    if(this.form.invalid){this.form.markAllAsTouched();this.formError.set('طرف حساب و تاریخ را وارد کنید.');return;}
    const err = this.validateLines();
    this.formError.set(err);
    if (err) return;

    const h = this.form.getRawValue();

    const normalize = (v: string | null | undefined): string => {
      const s = (v ?? '0').toString().replace(',', '.').trim();
      return s === '' ? '0' : s;
    };

    if (this.mode === 'insert') {
      const createLines = this.rowData.map(l => ({
        itemId: l.itemId ?? null,
        description: (l.description ?? '').trim(),
        quantity: normalize(l.quantity),
        unitPrice: normalize(l.unitPrice),
        discountRate:l.discountRate??'0',withholdingRate:l.withholdingRate??0,
        vatRate: Number(l.vatRate ?? 0)
      }));

      this.saveInsert.emit({
        contactId: h.contactId!,
        dateUtc: this.localToUtcIso(h.dateUtc),
        type: h.type,
        currency: h.currency,
        description: h.description || null,
        lines: createLines
      });
    } else {
      const updateLines = this.rowData.map(l => ({
        id: l.id && l.id > 0 ? l.id : null,
        itemId: l.itemId ?? null,
        description: (l.description ?? '').trim(),
        quantity: normalize(l.quantity),
        unitPrice: normalize(l.unitPrice),
        discountRate:l.discountRate??'0',withholdingRate:l.withholdingRate??0,
        vatRate: Number(l.vatRate ?? 0)
      }));

      this.saveUpdate.emit({
        id: this._id!,
        rowVersion: h.rowVersionBase64,
        contactId: h.contactId!,
        dateUtc: this.localToUtcIso(h.dateUtc),
        description: h.description || null,
        lines: updateLines
      });
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

  // Backend'e InvoiceType (Order.Type için yeniden kullanılıyor) her zaman sayı olarak
  // gitmeli (System.Text.Json enum'ları varsayılan olarak sayı bekler, JsonStringEnumConverter
  // kayıtlı değil).
  private typeToNumber(val: OrderType | number): number {
    return typeof val === 'number' ? val : Number(val);
  }

  private preview(row?:LineRow) {
    try{const amount=calculateInvoiceLine({qty:row?.quantity??0,unitPrice:row?.unitPrice??0,vatRate:row?.vatRate??0,discountRate:row?.discountRate??0,withholdingRate:row?.withholdingRate??0});return {net:amount.net,vat:amount.vat,gross:amount.grandTotal};}
    catch{return {net:'0.00',vat:'0.00',gross:'0.00'};}
  }
  @ViewChild(AgGridAngular) private linesGrid?:AgGridAngular;
  advanced=false;
  readPackageRows=():MealPackageRow[]=>{
    this.linesGrid?.api?.stopEditing();const error=this.validateLines();this.formError.set(error);if(error)return [];
    if(this.rowData.some(l=>!l.itemId)){this.formError.set('برای ساخت پکیج، غذا یا خدمت هر ردیف را از فهرست انتخاب کنید.');return [];}
    return this.rowData.map(l=>({itemId:l.itemId!,quantity:l.quantity!,unitPrice:l.unitPrice!,vatRate:l.vatRate??0,discountRate:l.discountRate??'0',withholdingRate:l.withholdingRate??0}));
  };
  appendPackage(rows:MealPackageRow[]):void {
    if(this.readonly()||!this.packagesAllowed)return;this.linesGrid?.api?.stopEditing();
    const next=this.rowData.map(row=>({...row}));
    try{for(const l of rows){
      const existing=next.find(row=>row.itemId===l.itemId);
      if(existing)existing.quantity=new Decimal(existing.quantity||'0').plus(l.quantity).toFixed(3);
      else next.push({id:0,_cid:`c${this._cidSeq++}`,itemId:l.itemId,itemName:l.name,description:l.name??'',quantity:String(l.quantity),unitPrice:String(l.unitPrice),vatRate:l.vatRate,discountRate:String(l.discountRate),withholdingRate:l.withholdingRate});
    }}catch{this.formError.set('ابتدا تعداد ردیف‌های فعلی را اصلاح کنید.');return;}
    this.rowData=next;this.formError.set(null);this.refreshTotals();
  }
  applyAll(field:'quantity'|'discountRate',value:string):void{
    if(this.readonly())return;this.linesGrid?.api?.stopEditing();const v=latinDigits(value).replace(',','.').trim();
    if(!/^\d+(\.\d{1,3})?$/.test(v)||(field==='quantity'?Number(v)<=0:Number(v)>100)){this.formError.set('مقدار واردشده معتبر نیست.');return;}
    this.rowData=this.rowData.map(l=>({...l,[field]:v}));this.formError.set(null);this.refreshTotals();
  }
  toggleColumns():void{this.linesGrid?.api?.setColumnsVisible(['vatRate','withholdingRate'],this.advanced);}
  refreshTotals():void{this.linesGrid?.api?.refreshCells({force:true});}
  get total():string{return this.rowData.reduce((sum,l)=>sum.plus(this.preview(l).gross),new Decimal(0)).toFixed(2);}
}
