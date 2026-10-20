import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { UnitPickerComponent } from '../../shared/unit-picker/unit-picker.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { PersianNumberInputDirective } from '../../shared/directives/persian-number-input.directive';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { EntityActionsCell, EntityActionsContext } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { ItemsService } from '../../core/services/items.service';
import { ItemListItemDto, ListItemsQuery, ItemType, ItemTypeNames } from '../../core/models/item.models';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemFormDialogComponent, ItemFormDialogData } from './item-form-dialog.component';
import { CategoryPickerComponent } from '../../shared/category-picker/category-picker.component';

@Component({
    standalone: true,
    selector: 'app-items-page',
    imports: [FilterPanelComponent, UnitPickerComponent, CategoryPickerComponent, AgGridAngular, GridPaginatorComponent, PersianNumberInputDirective,
        CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
    ],
    template: `
    <div class="toolbar">
      <span class="title">غذا، کالا و خدمات</span>
      <span class="spacer"></span>
      <button *appHasPermission="'Item.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        کالای جدید
      </button>
    </div>

    <!-- Basit Filtre Alanları -->
    <app-filter-panel (apply)="apply()" (reset)="reset()">
<app-category-picker [(ngModel)]="filters.categoryId"></app-category-picker>
        <mat-form-field appearance="outline">
            <mat-label>جستجو (نام)</mat-label>
            <input matInput [(ngModel)]="filters.search" placeholder="">
        </mat-form-field>
        <app-unit-picker [(ngModel)]="filters.unitId"></app-unit-picker>
        <mat-form-field appearance="outline" style="width: 120px;">
            <mat-label>مالیات بر ارزش افزوده (٪)</mat-label>
            <input matInput type="text" persianNumber="number" min="0" max="100" [(ngModel)]="filters.vatRate" placeholder="">
       </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>کارت‌های کالا</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
export class ItemsPageComponent {
    // BE whitelist: code, name, vatrate, price
    sortWhitelist = ['code', 'name', 'vatrate', 'price'];

    colDefs: ColDef<ItemListItemDto>[] = [
        { field: 'code', headerName: 'کد', sortable: true, minWidth: 120 },
        { field: 'name', headerName: 'نام', sortable: true, minWidth: 180 },
        { field: 'categoryName', headerName: 'دسته‌بندی', sortable: false, minWidth: 160 },
        { headerName: 'نوع', sortable: false, minWidth: 110, valueGetter: p => p.data ? (ItemTypeNames[p.data.type as ItemType] ?? p.data.type) : '' },
        { field: 'unitName', headerName: 'واحد', sortable: false, maxWidth: 120 },
        { field: 'vatRate', headerName: 'مالیات بر ارزش افزوده (٪)', sortable: true, maxWidth: 120, type: 'rightAligned' },
        { field: 'purchasePrice', headerName: 'قیمت خرید', sortable: true, type: 'rightAligned', minWidth: 140 },
        { field: 'salesPrice', headerName: 'قیمت فروش', sortable: true, type: 'rightAligned', minWidth: 140 },
        { field: 'createdAtUtc', headerName: 'زمان ایجاد', sortable: false, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : '' },
        {
            headerName: '', colId: 'actions', width: 100, pinned: 'left',
            sortable: false, filter: false, suppressHeaderMenuButton: true,
            cellRenderer: EntityActionsCell
        }
    ];

    gridContext: EntityActionsContext<ItemListItemDto> = {
        onEdit: (row) => this.openEdit(row),
        onDelete: (row) => this.confirmDelete(row),
        updatePermission: 'Item.Update',
        deletePermission: 'Item.Delete'
    };

    // Basit filtre state
    filters: { categoryId: number | null; search: string | null; unitId: number | null; vatRate: number | null } = {
        categoryId: null, search: null, unitId: null, vatRate: null
    };

    @ViewChild('grid') grid!: PagedGridDirective<ItemListItemDto>; // ✅ template ref'i yakala

    constructor(
        private service: ItemsService,
        private dialog: MatDialog,
        private snack: MatSnackBar
    ) { }

    // ListGrid’e verilecek fetcher — grid page/sort ile beraber filtreleri geçiriyoruz
    fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string; }) => {
        const request: ListItemsQuery = {
            ...q,
            categoryId: this.filters.categoryId,
            search: (this.filters.search ?? '').trim() || null,
            unitId: this.filters.unitId,
            vatRate: this.filters.vatRate
        };
        return this.service.list(request);
    };

    apply() {
        this.grid.reload();
    }

    reset() {
        this.filters = { categoryId: null, search: null, unitId: null, vatRate: null };
        this.grid.reload();
    }

    openCreate() {
        const ref = this.dialog.open<ItemFormDialogComponent, ItemFormDialogData>(ItemFormDialogComponent, {
            data: { item: null }
        });
        ref.afterClosed().subscribe(result => {
            if (!result) return;
            this.service.create(result).subscribe({
                next: () => {
                    this.snack.open('کالا ایجاد شد.', 'بستن', { duration: 2000 });
                    this.grid.reload();
                }
            });
        });
    }

    openEdit(row: ItemListItemDto) {
        this.service.getById(row.id).subscribe(full => {
            const ref = this.dialog.open<ItemFormDialogComponent, ItemFormDialogData>(ItemFormDialogComponent, {
                data: { item: full }
            });
            ref.afterClosed().subscribe(result => {
                if (!result) return;
                this.service.update(full.id, {
                    id: full.id,
                    rowVersion: full.rowVersion,
                    ...result
                }).subscribe({
                    next: () => {
                        this.snack.open('کالا به‌روزرسانی شد.', 'بستن', { duration: 2000 });
                        this.grid.reload();
                    }
                });
            });
        });
    }

    confirmDelete(row: ItemListItemDto) {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'حذف کالا',
                message: `"${row.name}" حذف شود؟`,
                danger: true
            }
        });
        ref.afterClosed().subscribe(ok => {
            if (!ok) return;
            this.service.getById(row.id).subscribe(full => {
                this.service.delete(row.id, full.rowVersion).subscribe({
                    next: () => {
                        this.snack.open('کالا حذف شد.', 'بستن', { duration: 2000 });
                        this.grid.reload();
                    }
                });
            });
        });
    }
}
