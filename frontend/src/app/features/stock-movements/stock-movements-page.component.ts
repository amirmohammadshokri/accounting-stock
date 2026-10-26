import { inject } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { StockMovementsService } from '../../core/services/stock-movements.service';
import {
  StockMovementListItemDto,
  ListStockMovementsQuery,
  StockMovementType,
  getMovementTypeDisplayName,
  isInboundMovement
} from '../../core/models/stock-movement.models';
import { WarehousesService } from '../../core/services/warehouses.service';
import { WarehouseListItemDto } from '../../core/models/warehouse.models';
import { StockMovementFormDialogComponent } from './stock-movement-form-dialog.component';
import { StockTransferDialogComponent } from './stock-transfer-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  standalone: true,
  selector: 'app-stock-movements-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent, PersianDateFieldComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">گردش انبار</span>
      <span class="spacer"></span>
      <button *appHasPermission="'Stock.Transfer'" mat-stroked-button (click)="openTransfer()">
        <mat-icon [svgIcon]="'swap_horiz'"></mat-icon>
        انتقال بین انبارها
      </button>
      <button *appHasPermission="'StockMovement.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        گردش جدید
      </button>
    </div>

    <app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field appearance="outline" class="warehouse-field">
        <mat-label>انبار</mat-label>
        <mat-select [(ngModel)]="warehouseId">
          <mat-option [value]="null">همه انبارها</mat-option>
          @for (w of warehouses; track w.id) {
            <mat-option [value]="w.id">{{ w.code }} - {{ w.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>نوع گردش</mat-label>
        <mat-select [(ngModel)]="type">
          <mat-option [value]="null">همه</mat-option>
          @for (t of movementTypes; track t) {
            <mat-option [value]="t">{{ typeLabel(t) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <app-persian-date-field label="از تاریخ" mode="date" [(ngModel)]="fromDate"></app-persian-date-field>
      <app-persian-date-field label="تا تاریخ" mode="date" [(ngModel)]="toDate"></app-persian-date-field>

</app-filter-panel>

    <div class="grid-heading"><h2>گردش انبار</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
<ag-grid-angular class="app-data-grid"
      #grid="appPagedGrid"
      [columnDefs]="colDefs"
      [sortWhitelist]="sortWhitelist"
      [appPagedGrid]="fetcher"></ag-grid-angular>
<app-grid-paginator [grid]="grid"></app-grid-paginator>
  `,
  styles: [`
    .toolbar { display:flex; align-items:center; gap:8px; padding:8px 0; }
    .title { font-weight:600; }
    .spacer { flex:1; }
    
    
    ::ng-deep .qty-in { color: #1b8a3a; font-weight: 600; }
    ::ng-deep .qty-out { color: var(--mat-sys-error); font-weight: 600; }
  `]
})
export class StockMovementsPageComponent {
  sortWhitelist = ['date', 'created', 'item'];

  movementTypes = [
    StockMovementType.PurchaseIn,
    StockMovementType.SalesOut,
    StockMovementType.AdjustmentIn,
    StockMovementType.AdjustmentOut,
    StockMovementType.SalesReturn,
    StockMovementType.PurchaseReturn,
    StockMovementType.TransferOut,
    StockMovementType.TransferIn,
    StockMovementType.OpeningBalance
  ];
  typeLabel = getMovementTypeDisplayName;

  warehouseId: number | null = null;
  type: StockMovementType | null = null;
  fromDate: string | null = null;
  toDate: string | null = null;
  warehouses: WarehouseListItemDto[] = [];

  colDefs: ColDef<StockMovementListItemDto>[] = [
    { field: 'transactionDateUtc', headerName: 'تاریخ', colId: 'date', sortable: true, minWidth: 160, valueFormatter: p => p.value ? new Date(p.value).toLocaleString('fa-IR') : '' },
    { field: 'warehouseCode', headerName: 'انبار', sortable: false, minWidth: 110 },
    { field: 'itemCode', headerName: 'کد کالا', sortable: false, minWidth: 130 },
    { field: 'itemName', headerName: 'نام کالا', colId: 'item', sortable: true, minWidth: 200 },
    { headerName: 'نوع', colId: 'type', sortable: false, minWidth: 140, valueGetter: p => p.data ? this.typeLabel(p.data.type) : '' },
    {
      headerName: 'مقدار', colId: 'qty', sortable: false, type: 'rightAligned', minWidth: 120,
      valueGetter: p => p.data ? `${isInboundMovement(p.data.type) ? '+' : '-'}${p.data.quantity}` : '',
      cellClass: p => p.data && isInboundMovement(p.data.type) ? 'qty-in' : 'qty-out'
    },
    { field: 'note', headerName: 'یادداشت', sortable: false, minWidth: 200 }
  ];

  @ViewChild('grid') grid!: PagedGridDirective<StockMovementListItemDto>;

  constructor(
    private service: StockMovementsService,
    private warehousesService: WarehousesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {
    if (inject(PermissionService).has('Warehouse.Read')) this.warehousesService.list().subscribe(res => (this.warehouses = res.items));
  }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string }) => {
    const query: ListStockMovementsQuery = {
      ...q,
      warehouseId: this.warehouseId,
      type: this.type,
      fromUtc: this.fromDate ? new Date(this.fromDate + 'T00:00:00').toISOString() : null,
      toUtc: this.toDate ? new Date(this.toDate + 'T23:59:59').toISOString() : null
    };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() {
    this.warehouseId = null;
    this.type = null;
    this.fromDate = null;
    this.toDate = null;
    this.grid.reload();
  }

  openCreate() {
    const ref = this.dialog.open(StockMovementFormDialogComponent, {
      data: { warehouseId: this.warehouseId }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('گردش انبار ثبت شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openTransfer() {
    const ref = this.dialog.open(StockTransferDialogComponent);
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.transfer(result).subscribe({
        next: (res) => {
          this.snack.open(res.message || 'انتقال انجام شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }
}
