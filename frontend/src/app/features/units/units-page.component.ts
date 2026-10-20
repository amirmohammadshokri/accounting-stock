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
import { UnitsService } from '../../core/services/units.service';
import { UnitListItemDto, ListUnitsQuery } from '../../core/models/unit.models';
import { UnitFormDialogComponent, UnitFormDialogData } from './unit-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-units-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">واحدهای کالا</span>
      <span class="spacer"></span>
      <button *appHasPermission="'Unit.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        واحد کالا جدید
      </button>
    </div>

    <app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field appearance="outline">
        <mat-label>جستجو (نام)</mat-label>
        <input matInput [(ngModel)]="search">
      </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>واحدهای کالا</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
export class UnitsPageComponent {
  sortWhitelist: string[] = []; // Backend sort desteklemiyor
  search: string | null = null;

  colDefs: ColDef<UnitListItemDto>[] = [
    { field: 'name', headerName: 'نام', sortable: false, minWidth: 200 },
    { field: 'description', headerName: 'شرح', sortable: false, minWidth: 260 },
    { field: 'createdAtUtc', headerName: 'زمان ایجاد', sortable: false, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : '' },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<UnitListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'Unit.Update',
    deletePermission: 'Unit.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<UnitListItemDto>;

  constructor(
    private service: UnitsService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) { }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string }) => {
    const query: ListUnitsQuery = {
      filters:q.filters, page: q.pageNumber,
      pageSize: q.pageSize,
      search: (this.search ?? '').trim() || null
    };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() { this.search = null; this.grid.reload(); }

  openCreate() {
    this.dialog.open<UnitFormDialogComponent,UnitFormDialogData>(UnitFormDialogComponent, {
      width:'480px',maxWidth:'95vw',data:{unit:null}
    }).afterClosed().subscribe(result=>{if(result){this.snack.open('واحد کالا ایجاد شد.','بستن',{duration:2500});this.grid.reload();}});
  }
  openEdit(row:UnitListItemDto) {
    this.service.getById(row.id).subscribe(unit=>{
      this.dialog.open<UnitFormDialogComponent,UnitFormDialogData>(UnitFormDialogComponent,{
        width:'480px',maxWidth:'95vw',data:{unit}
      }).afterClosed().subscribe(result=>{if(result){this.snack.open('واحد کالا به‌روزرسانی شد.','بستن',{duration:2500});this.grid.reload();}});
    });
  }
  confirmDelete(row:UnitListItemDto) {
    this.dialog.open(ConfirmDialogComponent,{data:{title:'حذف واحد کالا',message:`واحد «${row.name}» حذف شود؟`,danger:true}}).afterClosed().subscribe(ok=>{
      if(!ok)return;
      this.service.delete(row.id,row.rowVersion).subscribe({next:()=>{this.snack.open('واحد کالا حذف شد.','بستن',{duration:2500});this.grid.reload();}});
    });
  }
}
