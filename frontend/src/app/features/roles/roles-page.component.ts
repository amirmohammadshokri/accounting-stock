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
import { map } from 'rxjs';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { EntityActionsCell, EntityActionsContext } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { RolesService } from '../../core/services/roles.service';
import { RoleListItemDto } from '../../core/models/role.models';
import { RoleFormDialogComponent, RoleFormDialogData } from './role-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-roles-page',
  imports: [AgGridAngular, GridPaginatorComponent,
    CommonModule, MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">نقش‌ها</span>
      <span class="spacer"></span>
      <button *appHasPermission="'Role.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        نقش جدید
      </button>
    </div>

    <div class="grid-heading"><h2>نقش‌ها</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
export class RolesPageComponent {
  sortWhitelist: string[] = [];

  colDefs: ColDef<RoleListItemDto>[] = [
    { field: 'name', headerName: 'نام نقش', sortable: false, minWidth: 200 },
    { field: 'description', headerName: 'شرح', sortable: false, minWidth: 260, valueGetter: p => p.data?.description ?? '—' },
    { field: 'permissionCount', headerName: 'تعداد مجوزها', sortable: false, type: 'rightAligned', maxWidth: 140 },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<RoleListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'Role.Update',
    deletePermission: 'Role.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<RoleListItemDto>;

  constructor(
    private service: RolesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  fetcher = (q:{filters?:string;pageNumber?:number;pageSize?:number}) => this.service.list().pipe(map(rows=>{const all=filterAllRows(rows,q.filters);const size=q.pageSize??25;return {items:all.slice(((q.pageNumber??1)-1)*size,(q.pageNumber??1)*size),total:all.length};}));

  openCreate() {
    const ref = this.dialog.open<RoleFormDialogComponent, RoleFormDialogData>(RoleFormDialogComponent, {
      data: { role: null }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('نقش ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: RoleListItemDto) {
    this.service.getById(row.id).subscribe(full => {
      const ref = this.dialog.open<RoleFormDialogComponent, RoleFormDialogData>(RoleFormDialogComponent, {
        data: { role: full }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(full.id, { id: full.id, ...result }).subscribe({
          next: () => {
            this.snack.open('نقش به‌روزرسانی شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }

  confirmDelete(row: RoleListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف نقش',
        message: `"${row.name}" حذف شود؟ اگر کاربری این نقش را داشته باشد، حذف انجام نمی‌شود.`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.delete(row.id).subscribe({
        next: () => {
          this.snack.open('نقش حذف شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }
}
