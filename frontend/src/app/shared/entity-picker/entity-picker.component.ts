import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { ColDef } from 'ag-grid-community';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { PagedResult } from '../ag-grid/paged-grid.directive';
import { LookupDialogComponent, LookupDialogData, LookupQuery } from '../lookup-dialog/lookup-dialog.component';

export interface PickerOption {
  id: number;
  label: string;
  sublabel?: string | null;
}

/**
 * Binlerce kayıt olabilecek listelerde (stok kartı, cari, kasa/banka vb.) top-N autocomplete'e
 * ek olarak sayfalama+aramalı LookupDialogComponent açan yapılandırma. `fetcher` burada
 * PagedGridDirective'in beklediği sayfalı/sıralı kontrata `search` eklenmiş halidir — genelde
 * doğrudan ilgili servisin `list()` metoduyla eşleşir (örn. `(q) => itemsService.list(q)`).
 */
export interface LookupConfig<T = unknown> {
  title: string;
  columns: ColDef<T>[];
  fetcher: (q: LookupQuery) => Observable<PagedResult<T>>;
  toOption: (row: T) => PickerOption;
  sortWhitelist?: string[];
  searchPlaceholder?: string;
}

/**
 * Genel amaçlı arama/autocomplete bileşeni. `fetcher` parametrik olduğu için
 * Contact/Branch/Item gibi farklı varlık servisleriyle beslenebilir.
 */
@Component({
  standalone: true,
  selector: 'app-entity-picker',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, ...APP_ICON_IMPORTS, MatButtonModule],
  template: `
    <mat-form-field appearance="outline" [style.width]="width">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [formControl]="control"
        [matAutocomplete]="auto"
        (focus)="ensureLoaded()"
        [placeholder]="placeholder ?? ''"
      />
      @if (lookup) {
        <button mat-icon-button matSuffix type="button" tabindex="-1" (click)="openLookup()" title="انتخاب از فهرست (صفحه‌بندی / جستجو)">
          <mat-icon [svgIcon]="'search'"></mat-icon>
        </button>
      }
      <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayWith" (optionSelected)="onSelected($event)">
        @for (opt of options; track opt.id) {
          <mat-option [value]="opt">
            {{ opt.label }}
            @if (opt.sublabel) { <span class="sublabel"> — {{ opt.sublabel }}</span> }
          </mat-option>
        }
        @if (options.length === 0) {
          <mat-option disabled>نتیجه‌ای یافت نشد</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [`
    .sublabel { color: var(--mat-sys-on-surface-variant, #666); font-size: 0.9em; }
  `]
})
export class EntityPickerComponent implements OnInit, OnChanges {
  @Input({ required: true }) label = '';
  @Input({ required: true }) fetcher!: (search: string) => Observable<PickerOption[]>;
  @Input() value: number | null = null;
  @Input() initialLabel: string | null = null;
  @Input() width = '100%';
  @Input() clearOnSelect = false;
  @Input() placeholder: string | null = null;
  /**
   * Verilirse alanın yanında, sayfalama+aramalı tam liste dialog'unu açan bir arama ikonu gösterilir.
   * `any` — çağıranlar somut bir entity tipiyle (örn. LookupConfig<ContactListItemDto>) bağlar;
   * Angular'ın strict template derlemesi ColDef<T>'nin invariant alanları (örn. `field`) yüzünden
   * LookupConfig<Concrete>'i LookupConfig<unknown>'a atamayı reddediyor.
   */
  @Input() lookup?: LookupConfig<any>;
  @Output() valueChange = new EventEmitter<number | null>();

  private dialog = inject(MatDialog);

  control = new FormControl<string | PickerOption>('');
  options: PickerOption[] = [];
  private loaded = false;

  ngOnInit() {
    if (this.value != null && this.initialLabel) {
      this.control.setValue({ id: this.value, label: this.initialLabel }, { emitEvent: false });
    }

    this.control.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged((a, b) => this.toSearchTerm(a) === this.toSearchTerm(b)),
        switchMap(v => {
          if (v != null && typeof v !== 'string') return of([]); // seçim yapıldı, arama tetikleme
          return this.fetcher(this.toSearchTerm(v));
        })
      )
      .subscribe(opts => {
        this.options = opts;
        this.loaded = true;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['value'] || changes['initialLabel']) && this.value != null && this.initialLabel) {
      const current = this.control.value;
      const currentId = current != null && typeof current !== 'string' ? current.id : null;
      if (currentId !== this.value) {
        this.control.setValue({ id: this.value, label: this.initialLabel }, { emitEvent: false });
      }
    }
    if ((changes['value']) && this.value == null) {
      this.control.setValue('', { emitEvent: false });
    }
  }

  ensureLoaded() {
    if (!this.loaded) {
      this.fetcher('').subscribe(opts => {
        this.options = opts;
        this.loaded = true;
      });
    }
  }

  displayWith = (opt: PickerOption | string | null): string => {
    if (opt == null) return '';
    return typeof opt === 'string' ? opt : opt.label;
  };

  onSelected(e: MatAutocompleteSelectedEvent) {
    const opt = e.option.value as PickerOption;
    this.valueChange.emit(opt.id);
    if(this.clearOnSelect){this.control.setValue('',{emitEvent:false});this.options=[];this.loaded=false;}
  }

  openLookup() {
    const cfg = this.lookup;
    if (!cfg) return;
    const ref = this.dialog.open<LookupDialogComponent<unknown>, LookupDialogData<unknown>>(LookupDialogComponent, {
      width: '820px',
      maxWidth: '95vw',
      data: {
        title: cfg.title,
        columns: cfg.columns,
        fetcher: cfg.fetcher,
        sortWhitelist: cfg.sortWhitelist,
        searchPlaceholder: cfg.searchPlaceholder
      }
    });
    ref.afterClosed().subscribe(row => {
      if (!row) return;
      const opt = cfg.toOption(row);
      this.control.setValue(opt, { emitEvent: false });
      this.loaded = true;
      this.valueChange.emit(opt.id);
    if(this.clearOnSelect){this.control.setValue('',{emitEvent:false});this.options=[];this.loaded=false;}
    });
  }

  private toSearchTerm(v: string | PickerOption | null): string {
    if (v == null) return '';
    return typeof v === 'string' ? v : v.label;
  }
}
