import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { EntityActionsCell, EntityActionsContext } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PermissionService } from '../../core/services/permission.service';
import { WarehousesService } from '../../core/services/warehouses.service';
import { WarehouseListItemDto, ListWarehousesQuery } from '../../core/models/warehouse.models';
import { BranchesService } from '../../core/services/branches.service';
import { BranchListItemDto } from '../../core/models/branch.models';
import { WarehouseFormDialogComponent, WarehouseFormDialogData } from './warehouse-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-warehouses-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule,
    ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
  ],
  template: `
    <section class="warehouse-help"><h2>انبار چه کاربردی دارد؟</h2><p>انبار محل نگهداری کالاهای موجودی‌دار مثل برنج، روغن و نوشابه است. خرید، موجودی این کالاها را زیاد و فروش، آن را کم می‌کند. خدماتی مثل پذیرایی موجودی انبار ندارند.</p><p>برای دیدن تعداد کالاها به «موجودی کالا» و برای ورود، خروج یا جابه‌جایی بین انبارها به «گردش و انتقال کالا» بروید. برای شروع می‌توانید یک انبار اصلی برای شعبه تعریف کنید. مصرف مواد اولیه برای پخت را از گردش انبار ثبت کنید؛ مواد اولیه هر غذا به‌صورت خودکار محاسبه نمی‌شود.</p></section>
    <div class="toolbar">
      <span class="title">انبارها</span>
      <span class="spacer"></span>
    
<button *appHasPermission="'Warehouse.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        انبار جدید
      </button>
</div>

    <app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field *appHasPermission="'Branch.Read'" appearance="outline" class="branch-field">
        <mat-label>شعبه</mat-label>
        <mat-select [(ngModel)]="branchId">
          <mat-option [value]="null">همه شعبه‌ها</mat-option>
          @for (b of branches; track b.id) {
            <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>انبارها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
<ag-grid-angular class="app-data-grid"
      #grid="appPagedGrid"
      [columnDefs]="colDefs"
      [sortWhitelist]="sortWhitelist"
      [appPagedGrid]="fetcher"
      [context]="gridContext"></ag-grid-angular>
<app-grid-paginator [grid]="grid"></app-grid-paginator>
  `,
  styles: [`
    .warehouse-help{padding:20px 24px;border-radius:18px;background:var(--mat-sys-primary-container);color:var(--mat-sys-on-primary-container);margin-bottom:20px}.warehouse-help h2{font-size:18px;margin:0 0 12px}.warehouse-help p{line-height:2;margin:8px 0;font-size:13px}
    .toolbar { display:flex; align-items:center; padding:8px 0; }
    .title { font-weight:600; }
    .spacer { flex:1; }
    
    
  `]
})
export class WarehousesPageComponent {
  sortWhitelist = ['code', 'name', 'isdefault'];
  branchId: number | null = null;
  branches: BranchListItemDto[] = [];

  colDefs: ColDef<WarehouseListItemDto>[] = [
    { field: 'id', headerName: 'شناسه', sortable: false, maxWidth: 80, pinned: 'right' },
    { field: 'code', headerName: 'کد', sortable: true, minWidth: 120 },
    { field: 'name', headerName: 'نام', sortable: true, minWidth: 200 },
    { field: 'branchId', headerName: 'شناسه شعبه', sortable: false, maxWidth: 100 },
    { field: 'isDefault', headerName: 'پیش‌فرض', sortable: true, maxWidth: 130, valueFormatter: p => p.value ? 'بله' : 'خیر' },
    { field: 'createdAtUtc', headerName: 'زمان ایجاد', sortable: false, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : '' },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<WarehouseListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'Warehouse.Update',
    deletePermission: 'Warehouse.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<WarehouseListItemDto>;

  constructor(
    private service: WarehousesService,
    private branchesService: BranchesService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private permissionService: PermissionService
  ) {
    if (this.permissionService.has('Branch.Read')) {
      this.branchesService.list().subscribe(res => (this.branches = res));
    }
  }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string }) => {
    const query: ListWarehousesQuery = { ...q, branchId: this.branchId };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() { this.branchId = null; this.grid.reload(); }

  openCreate() {
    const ref = this.dialog.open<WarehouseFormDialogComponent, WarehouseFormDialogData>(WarehouseFormDialogComponent, {
      data: { warehouse: null }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('انبار ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: WarehouseListItemDto) {
    this.service.getById(row.id).subscribe(full => {
      const ref = this.dialog.open<WarehouseFormDialogComponent, WarehouseFormDialogData>(WarehouseFormDialogComponent, {
        data: { warehouse: full }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(full.id, {
          id: full.id,
          rowVersion: full.rowVersion,
          branchId: result.branchId!,
          code: result.code!,
          name: result.name!,
          isDefault: result.isDefault!
        }).subscribe({
          next: () => {
            this.snack.open('انبار به‌روزرسانی شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }

  confirmDelete(row: WarehouseListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف انبار',
        message: `"${row.name}" حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      // Liste satırı rowVersion taşımıyor (backend WarehouseListItemDto'da yok) — getById ile al.
      this.service.getById(row.id).subscribe(full => {
        this.service.delete(row.id, full.rowVersion).subscribe({
          next: () => {
            this.snack.open('انبار حذف شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }
}
