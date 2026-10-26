import { inject } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { StocksService } from '../../core/services/stocks.service';
import { StockListItemDto, ListStocksQuery } from '../../core/models/stock.models';
import { WarehousesService } from '../../core/services/warehouses.service';
import { WarehouseListItemDto } from '../../core/models/warehouse.models';

@Component({
  standalone: true,
  selector: 'app-stocks-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, ...APP_ICON_IMPORTS, PagedGridDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">موجودی انبار</span>
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
        <mat-label>جستجو (کد کالا/نام)</mat-label>
        <input matInput [(ngModel)]="search">
      </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>موجودی انبار</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
<ag-grid-angular class="app-data-grid"
      #grid="appPagedGrid"
      [columnDefs]="colDefs"
      [sortWhitelist]="sortWhitelist"
      [appPagedGrid]="fetcher"></ag-grid-angular>
<app-grid-paginator [grid]="grid"></app-grid-paginator>
  `,
  styles: [`
    .toolbar { display:flex; align-items:center; padding:8px 0; }
    .title { font-weight:600; }
    
    
  `]
})
export class StocksPageComponent {
  sortWhitelist = ['itemCode', 'itemName', 'qty'];

  warehouseId: number | null = null;
  search: string | null = null;
  warehouses: WarehouseListItemDto[] = [];

  colDefs: ColDef<StockListItemDto>[] = [
    { field: 'warehouseCode', headerName: 'انبار', sortable: false, minWidth: 120 },
    { field: 'itemCode', headerName: 'کد کالا', sortable: true, minWidth: 140 },
    { field: 'itemName', headerName: 'نام کالا', sortable: true, minWidth: 220 },
    { field: 'unit', headerName: 'واحد', sortable: false, maxWidth: 100 },
    { field: 'quantity', headerName: 'مقدار', colId: 'qty', sortable: true, type: 'rightAligned', minWidth: 130 }
  ];

  @ViewChild('grid') grid!: PagedGridDirective<StockListItemDto>;

  constructor(
    private service: StocksService,
    private warehousesService: WarehousesService
  ) {
    if (inject(PermissionService).has('Warehouse.Read')) this.warehousesService.list().subscribe(res => (this.warehouses = res.items));
  }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string }) => {
    const query: ListStocksQuery = {
      ...q,
      warehouseId: this.warehouseId,
      search: (this.search ?? '').trim() || null
    };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() { this.warehouseId = null; this.search = null; this.grid.reload(); }
}
