import { filterAllRows } from '../../shared/ag-grid/column-filter.component';
import { AgGridAngular } from 'ag-grid-angular';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs/operators';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { EntityActionsCell, EntityActionsContext } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { BranchesService } from '../../core/services/branches.service';
import { BranchListItemDto } from '../../core/models/branch.models';
import { BranchFormDialogComponent, BranchFormDialogData } from './branch-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-branches-page',
  imports: [AgGridAngular, GridPaginatorComponent, CommonModule, MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective],
  template: `
    <div class="toolbar">
      <span class="title">شعبه‌ها</span>
      <span class="spacer"></span>
      <button *appHasPermission="'Branch.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        شعبه جدید
      </button>
    </div>

    <div class="grid-heading"><h2>شعبه‌ها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
<ag-grid-angular class="app-data-grid"
      #grid="appPagedGrid"
      [columnDefs]="colDefs"
      [sortWhitelist]="[]"
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
export class BranchesPageComponent {
  colDefs: ColDef<BranchListItemDto>[] = [
    { field: 'id', headerName: 'شناسه', maxWidth: 80, pinned: 'right' },
    { field: 'code', headerName: 'کد', minWidth: 140 },
    { field: 'name', headerName: 'نام', minWidth: 240 },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<BranchListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'Branch.Update',
    deletePermission: 'Branch.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<BranchListItemDto>;

  constructor(
    private service: BranchesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  fetcher = (q:{filters?:string;pageNumber?:number;pageSize?:number}) => this.service.list().pipe(map(rows=>{const all=filterAllRows(rows,q.filters);const size=q.pageSize??25;return {items:all.slice(((q.pageNumber??1)-1)*size,(q.pageNumber??1)*size),total:all.length};}));

  openCreate() {
    const ref = this.dialog.open<BranchFormDialogComponent, BranchFormDialogData>(BranchFormDialogComponent, {
      data: { branch: null }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('شعبه ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: BranchListItemDto) {
    // Liste satırı rowVersion taşımıyor (backend BranchListItemDto'da yok) — güncel veriyi getById ile al.
    this.service.getById(row.id).subscribe(branch => {
      const ref = this.dialog.open<BranchFormDialogComponent, BranchFormDialogData>(BranchFormDialogComponent, {
        data: { branch }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(branch.id, {
          id: branch.id,
          rowVersionBase64: branch.rowVersion,
          code: result.code!,
          logoDataUrl: result.logoDataUrl, address: result.address, phone: result.phone,
          name: result.name!
        }).subscribe({
          next: () => {
            this.snack.open('شعبه به‌روزرسانی شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }

  confirmDelete(row: BranchListItemDto) {
    this.service.getById(row.id).subscribe(branch => {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'حذف شعبه',
          message: `"${branch.name}" حذف شود؟`,
          danger: true
        }
      });
      ref.afterClosed().subscribe(ok => {
        if (!ok) return;
        this.service.delete(branch.id, branch.rowVersion).subscribe({
          next: () => {
            this.snack.open('شعبه حذف شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }
}
