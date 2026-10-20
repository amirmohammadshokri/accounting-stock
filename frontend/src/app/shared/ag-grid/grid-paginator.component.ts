import { Component, Input, Injectable } from '@angular/core';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PersianPipe } from '../persian.pipe';
import { PagedGridDirective } from './paged-grid.directive';
import { formatPersianNumber } from '../../core/utils/persian.utils';

@Injectable()
export class PersianPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'تعداد ردیف در صفحه';
  override nextPageLabel = 'صفحه بعد';
  override previousPageLabel = 'صفحه قبل';
  override firstPageLabel = 'اولین صفحه';
  override lastPageLabel = 'آخرین صفحه';
  override getRangeLabel = (page: number, size: number, total: number) => total === 0 ? 'بدون رکورد' : `${formatPersianNumber(page * size + 1)} تا ${formatPersianNumber(Math.min((page + 1) * size, total))} از ${formatPersianNumber(total)}`;
}

@Component({
  selector: 'app-grid-paginator', standalone: true,
  imports: [MatPaginatorModule, MatButtonModule, ...APP_ICON_IMPORTS, MatSelectModule, MatFormFieldModule, PersianPipe],
  providers: [{ provide: MatPaginatorIntl, useClass: PersianPaginatorIntl }],
  template: `
    @if (grid.error()) { <div class="error" role="alert"><mat-icon [svgIcon]="'error_outline'"></mat-icon><span>{{ grid.error() }}</span><button mat-button (click)="grid.reload()">تلاش دوباره</button></div> }
    <div class="column-filter-help"><span>برای فیلتر هر ستون، نشان فیلتر کنار عنوان آن را باز کنید.</span><button mat-button type="button" (click)="grid.clearColumnFilters()">پاک‌کردن فیلتر ستون‌ها</button></div>
    <div class="pager">
      <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>تعداد ردیف در صفحه</mat-label><mat-select [value]="grid.pageSize()" [disabled]="grid.loading()" (selectionChange)="grid.changePage(0, $event.value)">@for (size of sizes; track size) { <mat-option [value]="size">{{ size | persian }}</mat-option> }</mat-select></mat-form-field>
      <mat-paginator aria-label="صفحه‌بندی جدول" [length]="grid.total()" [pageIndex]="grid.pageNumber() - 1" [pageSize]="grid.pageSize()" [hidePageSize]="true" [showFirstLastButtons]="true" [disabled]="grid.loading()" (page)="grid.changePage($event.pageIndex, $event.pageSize)"></mat-paginator>
    </div>
  `,
  styles: [`.column-filter-help{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;font-size:11px;flex-wrap:wrap;color:var(--mat-sys-on-surface-variant)}:host { display: block; border: 1px solid var(--mat-sys-outline-variant); border-top: 0; border-radius: 0 0 16px 16px; overflow: hidden; background: var(--mat-sys-surface-container-low); } .pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 12px; } mat-form-field { width: 150px; } mat-paginator { background: transparent; } .error { display: flex; gap: 12px; align-items: center; padding: 12px; color: var(--mat-sys-on-error-container); background: var(--mat-sys-error-container); } .error span { flex: 1; }`]
})
export class GridPaginatorComponent { @Input({ required: true }) grid!: PagedGridDirective<any>; readonly sizes = [10, 25, 50, 100]; }
