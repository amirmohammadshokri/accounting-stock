import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { EntityActionsCell, EntityActionsContext } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { CategoriesService } from '../../core/services/categories.service';
import { CategoryListItemDto, ListCategoriesQuery } from '../../core/models/category.models';
import { CategoryFormDialogComponent, CategoryFormDialogData } from './category-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-categories-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">دسته‌بندی‌ها</span>
      <span class="spacer"></span>
      <button *appHasPermission="'Category.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        دسته‌بندی جدید
      </button>
    </div>

    <app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field appearance="outline">
        <mat-label>جستجو (نام)</mat-label>
        <input matInput [(ngModel)]="search">
      </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>دسته‌بندی‌ها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
<ag-grid-angular class="app-data-grid"
      #grid="appPagedGrid"
      [columnDefs]="colDefs"
      [sortWhitelist]="sortWhitelist"
      [appPagedGrid]="fetcher"
      [context]="gridContext"></ag-grid-angular>
<app-grid-paginator [grid]="grid"></app-grid-paginator>
  `,
  styles: [`
    .toolbar { display:flex; align-items:center; padding:8px 0; }
    .title { font-weight:600; }
    .spacer { flex:1; }
    
  `]
})
export class CategoriesPageComponent {
  sortWhitelist: string[] = []; // Backend sort desteklemiyor
  search: string | null = null;

  colDefs: ColDef<CategoryListItemDto>[] = [
    { field: 'name', headerName: 'نام', sortable: false, minWidth: 200 },
    { field: 'description', headerName: 'شرح', sortable: false, minWidth: 260 },
    {
      headerName: 'رنگ', colId: 'color', sortable: false, maxWidth: 100,
      cellRenderer: (p: any) => p.data?.color
        ? `<span style="display:inline-block;width:16px;height:16px;border-radius:3px;background:${p.data.color};border:1px solid rgba(0,0,0,.2);vertical-align:middle;"></span>`
        : ''
    },
    { field: 'createdAtUtc', headerName: 'زمان ایجاد', sortable: false, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : '' },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<CategoryListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'Category.Update',
    deletePermission: 'Category.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<CategoryListItemDto>;

  constructor(
    private service: CategoriesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) { }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string }) => {
    const query: ListCategoriesQuery = {
      filters:q.filters, page: q.pageNumber,
      pageSize: q.pageSize,
      search: (this.search ?? '').trim() || null
    };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() { this.search = null; this.grid.reload(); }

  openCreate() {
    const ref = this.dialog.open<CategoryFormDialogComponent, CategoryFormDialogData>(CategoryFormDialogComponent, {
      data: { category: null }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('دسته‌بندی ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: CategoryListItemDto) {
    const ref = this.dialog.open<CategoryFormDialogComponent, CategoryFormDialogData>(CategoryFormDialogComponent, {
      data: { category: row }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.update(row.id, {
        id: row.id,
        rowVersion: row.rowVersion,
        ...result
      }).subscribe({
        next: () => {
          this.snack.open('دسته‌بندی به‌روزرسانی شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  confirmDelete(row: CategoryListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف دسته‌بندی',
        message: `"${row.name}" حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.delete(row.id, row.rowVersion).subscribe({
        next: () => {
          this.snack.open('دسته‌بندی حذف شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }
}
