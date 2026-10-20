import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../ag-grid/grid-paginator.component';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PagedGridDirective, ListQuery, PagedResult } from '../ag-grid/paged-grid.directive';

export interface LookupQuery extends ListQuery { search?: string; }

export interface LookupDialogData<T> {
  title: string;
  columns: ColDef<T>[];
  fetcher: (q: LookupQuery) => Observable<PagedResult<T>>;
  sortWhitelist?: string[];
  searchPlaceholder?: string;
  pageSize?: number;
}

/**
 * Genel amaçlı, sayfalama + sunucu taraflı arama destekli seçim dialog'u.
 * Binlerce kayıt olabilecek listelerde (stok kartı, cari, kasa/banka vb.)
 * EntityPickerComponent'in top-N autocomplete'ine ek bir "listeye gözat" yolu sağlar.
 */
@Component({
  standalone: true,
  selector: 'app-lookup-dialog',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, ...APP_ICON_IMPORTS, MatButtonModule, PagedGridDirective
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="lookup-content">
      <app-filter-panel title="جستجو در فهرست" hint="نتایج هم‌زمان با نوشتن جستجو به‌روز می‌شوند." [compact]="true" [showApply]="false" (reset)="searchControl.setValue('')">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>جستجو</mat-label>
        <mat-icon matPrefix [svgIcon]="'search'"></mat-icon>
        <input
          matInput
          [formControl]="searchControl"
          [placeholder]="data.searchPlaceholder ?? 'با کد یا نام جستجو کنید…'"
          autocomplete="off">
      </mat-form-field>
      <button filterExtraActions mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button>
      </app-filter-panel>
<ag-grid-angular class="app-data-grid"
        #grid="appPagedGrid"
        [columnDefs]="data.columns"
        [sortWhitelist]="data.sortWhitelist ?? []"
        [appPagedGrid]="gridFetcher"
        [pageSizeInit]="data.pageSize ?? 10"
        (rowDoubleClicked)="$event.data && select($event.data)"></ag-grid-angular>
<app-grid-paginator [grid]="grid"></app-grid-paginator>

      <div class="hint">برای انتخاب، روی ردیف دوبار کلیک کنید.</div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" mat-button (click)="dialogRef.close()">انصراف</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .lookup-content { width: 100%; display:flex; flex-direction:column; gap:4px; }
    .search-field { width:100%; }
    .hint { font-size:0.8em; color: var(--mat-sys-on-surface-variant, #666); padding: 2px 4px 0; }
  `]
})
export class LookupDialogComponent<T> implements OnInit {
  dialogRef = inject(MatDialogRef<LookupDialogComponent<T>>);
  data = inject<LookupDialogData<T>>(MAT_DIALOG_DATA);

  @ViewChild('grid') grid!: PagedGridDirective<T>;

  searchControl = new FormControl('');
  private searchTerm = '';

  gridFetcher = (q: ListQuery) => this.data.fetcher({ ...q, search: this.searchTerm || undefined });

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(v => {
        this.searchTerm = (v ?? '').trim();
        this.grid.pageNumber.set(1);
        this.grid.reload();
      });

    // MatDialog'un açılış animasyonu tam bitmeden ag-grid mount olabiliyor; bu durumda
    // ag-grid'in dahili sütun-genişlik modeli, animasyonun nihai (daha geniş) konteyner
    // boyutuyla senkron kalmıyor — sonuç: sütunlar toplamda görünür alandan geniş
    // hesaplanıyor ve satırların tıklanabilir alanı gerçek görsel konumuyla eşleşmiyor.
    // Animasyon bittiğinde (afterOpened) ag-grid'e gerçek konteyner boyutuna göre
    // yeniden ölçmesini söylüyoruz.
    this.dialogRef.afterOpened().subscribe(() => {
      setTimeout(() => this.grid?.sizeColumnsToFit(), 0);
    });
  }

  select(row: T) {
    this.dialogRef.close(row);
  }
}
