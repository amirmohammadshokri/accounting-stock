import { Component, Input, OnChanges, SimpleChanges, ViewChild, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';
import { CategoriesService } from '../../core/services/categories.service';
import { CategoryListItemDto } from '../../core/models/category.models';
import { LookupDialogComponent, LookupDialogData } from '../lookup-dialog/lookup-dialog.component';

type CategoryOption = Pick<CategoryListItemDto, 'id' | 'name'>;

@Component({
  selector: 'app-category-picker', standalone: true,
  imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatButtonModule, ...APP_ICON_IMPORTS],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CategoryPickerComponent), multi: true }],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ label }}</mat-label>
      <input matInput [formControl]="control" [matAutocomplete]="auto" placeholder="جستجو یا انتخاب دسته‌بندی" (blur)="touch()">
      @if (selectedId !== null) { <button mat-icon-button matIconSuffix type="button" aria-label="پاک کردن دسته‌بندی" [disabled]="disabled" (click)="clear()"><mat-icon [svgIcon]="'close'"></mat-icon></button> }
      <button mat-icon-button matIconSuffix type="button" aria-label="انتخاب دسته‌بندی از فهرست" [disabled]="disabled" (click)="openLookup()"><mat-icon [svgIcon]="'search'"></mat-icon></button>
      <mat-autocomplete #auto="matAutocomplete" [displayWith]="display" (optionSelected)="select($event.option.value)">
        @for (category of options(); track category.id) { <mat-option [value]="category">{{ category.name }}</mat-option> }
        @if (loading()) { <mat-option disabled>در حال بارگذاری…</mat-option> }
        @else if (error()) { <mat-option disabled>{{ error() }}</mat-option> }
        @else if (options().length === 0) { <mat-option disabled>دسته‌بندی یافت نشد</mat-option> }
      </mat-autocomplete>
      @if (error()) { <mat-hint>{{ error() }} <button mat-button type="button" (click)="openLookup()">تلاش دوباره</button></mat-hint> }
    </mat-form-field>
  `,
  styles: [`:host { display: block; min-width: 0; } mat-form-field { width: 100%; }`]
})
export class CategoryPickerComponent implements ControlValueAccessor, OnChanges {
  @Input() label = 'دسته‌بندی';
  @Input() initialName: string | null = null;
  @ViewChild(MatAutocompleteTrigger) private autocomplete?: MatAutocompleteTrigger;
  private service = inject(CategoriesService);
  private dialog = inject(MatDialog);
  readonly control = new FormControl<string | CategoryOption>('');
  readonly options = signal<CategoryListItemDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  selectedId: number | null = null;
  disabled = false;
  private change: (id: number | null) => void = () => {};
  private touched = () => {};
  readonly display = (value: string | CategoryOption | null) => typeof value === 'string' ? value : value?.name ?? '';

  constructor() {
    this.control.valueChanges.pipe(
      tap(value => { if (typeof value === 'string') { this.selectedId = null; this.change(null); } }),
      startWith(''), debounceTime(200),
      map(value => typeof value === 'string' ? value.trim() : ''), distinctUntilChanged(),
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap(search => this.service.list({ search, page: 1, pageSize: 20 }).pipe(
        map(result => result.items), catchError(() => { this.error.set('دریافت دسته‌بندی‌ها ناموفق بود.'); return of([]); })
      )), takeUntilDestroyed()
    ).subscribe(categories => { this.options.set(categories); this.loading.set(false); });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialName'] && this.selectedId != null) this.control.setValue({ id: this.selectedId, name: this.initialName ?? '' }, { emitEvent: false });
  }
  writeValue(id: number | null) { this.selectedId = id ?? null; this.control.setValue(id == null ? '' : { id, name: this.initialName ?? '' }, { emitEvent: false }); }
  registerOnChange(fn: (id: number | null) => void) { this.change = fn; }
  registerOnTouched(fn: () => void) { this.touched = fn; }
  setDisabledState(disabled: boolean) { this.disabled = disabled; disabled ? this.control.disable({ emitEvent: false }) : this.control.enable({ emitEvent: false }); }
  touch() { this.touched(); }
  clear() { this.control.setValue(''); this.selectedId = null; this.change(null); this.touch(); this.autocomplete?.closePanel(); }
  select(category: CategoryOption) { this.selectedId = category.id; this.control.setValue(category, { emitEvent: false }); this.change(category.id); this.touch(); }
  openLookup() {
    if (this.disabled) return;
    this.autocomplete?.closePanel();
    const ref = this.dialog.open<LookupDialogComponent<CategoryListItemDto>, LookupDialogData<CategoryListItemDto>, CategoryListItemDto>(LookupDialogComponent, {
      width: '820px', maxWidth: '95vw',
      data: {
        title: 'انتخاب دسته‌بندی', columns: [{ field: 'name', headerName: 'نام دسته‌بندی', flex: 1, minWidth: 160, sortable: false }, { field: 'description', headerName: 'شرح', minWidth: 200, sortable: false }],
        fetcher: query => this.service.list({ filters:query.filters, search: query.search, page: query.pageNumber, pageSize: query.pageSize }),
        searchPlaceholder: 'جستجوی نام دسته‌بندی'
      }
    });
    ref.afterClosed().subscribe(category => { if (category) this.select(category); });
  }
}
