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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { UserActionsCell, UserActionsContext } from './user-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { UsersService } from '../../core/services/users.service';
import { RolesService } from '../../core/services/roles.service';
import { BranchesService } from '../../core/services/branches.service';
import { UserListItemDto, ListUsersQuery, getUserFullName, getUserStatusDisplayName } from '../../core/models/user.models';
import { RoleListItemDto } from '../../core/models/role.models';
import { BranchListItemDto } from '../../core/models/branch.models';
import { UserFormDialogComponent, UserFormDialogData } from './user-form-dialog.component';
import { ChangePasswordDialogComponent, ChangePasswordDialogData } from './change-password-dialog.component';

@Component({
  standalone: true,
  selector: 'app-users-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">کاربران</span>
      <span class="spacer"></span>
      <button mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        کاربر جدید
      </button>
    </div>

    <app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field appearance="outline" class="branch-field">
        <mat-label>شعبه</mat-label>
        <mat-select [(ngModel)]="branchId">
          <mat-option [value]="null">همه شعبه‌ها</mat-option>
          @for (b of branches; track b.id) {
            <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="role-field">
        <mat-label>نقش</mat-label>
        <mat-select [(ngModel)]="roleId">
          <mat-option [value]="null">همه نقش‌ها</mat-option>
          @for (r of roles; track r.id) {
            <mat-option [value]="r.id">{{ r.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>وضعیت</mat-label>
        <mat-select [(ngModel)]="isActive">
          <mat-option [value]="null">همه</mat-option>
          <mat-option [value]="true">فعال</mat-option>
          <mat-option [value]="false">غیرفعال</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>جستجو (نام/ایمیل)</mat-label>
        <input matInput [(ngModel)]="search">
      </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>کاربران</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
export class UsersPageComponent {
  sortWhitelist: string[] = [];

  branchId: number | null = null;
  roleId: number | null = null;
  isActive: boolean | null = null;
  search: string | null = null;
  branches: BranchListItemDto[] = [];
  roles: RoleListItemDto[] = [];

  colDefs: ColDef<UserListItemDto>[] = [
    { headerName: 'نام و نام خانوادگی', colId: 'fullName', sortable: false, minWidth: 200, valueGetter: p => p.data ? getUserFullName(p.data) : '' },
    { field: 'email', headerName: 'ایمیل', sortable: false, minWidth: 220 },
    { field: 'branchName', headerName: 'شعبه', sortable: false, minWidth: 160, valueGetter: p => p.data?.branchName ?? '—' },
    { headerName: 'وضعیت', colId: 'status', sortable: false, minWidth: 100, valueGetter: p => p.data ? getUserStatusDisplayName(p.data.isActive) : '' },
    {
      headerName: '', colId: 'actions', width: 130, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: UserActionsCell
    }
  ];

  gridContext: UserActionsContext<UserListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    onChangePassword: (row) => this.openChangePassword(row)
  };

  @ViewChild('grid') grid!: PagedGridDirective<UserListItemDto>;

  constructor(
    private service: UsersService,
    private rolesService: RolesService,
    private branchesService: BranchesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {
    this.branchesService.list().subscribe(res => (this.branches = res));
    this.rolesService.list().subscribe(res => (this.roles = res));
  }

  fetcher = (q: { filters?:string; pageNumber?: number; pageSize?: number; sort?: string }) => {
    const query: ListUsersQuery = {
      filters:q.filters, page: q.pageNumber,
      pageSize: q.pageSize,
      branchId: this.branchId,
      roleId: this.roleId,
      isActive: this.isActive,
      search: (this.search ?? '').trim() || null
    };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() {
    this.branchId = null;
    this.roleId = null;
    this.isActive = null;
    this.search = null;
    this.grid.reload();
  }

  openCreate() {
    const ref = this.dialog.open<UserFormDialogComponent, UserFormDialogData>(UserFormDialogComponent, {
      data: { user: null, branches: this.branches, roles: this.roles }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('کاربر ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: UserListItemDto) {
    this.service.getById(row.id).subscribe(full => {
      const ref = this.dialog.open<UserFormDialogComponent, UserFormDialogData>(UserFormDialogComponent, {
        data: { user: full, branches: this.branches, roles: this.roles }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(full.id, { id: full.id, ...result }).subscribe({
          next: () => {
            this.snack.open('کاربر به‌روزرسانی شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }

  openChangePassword(row: UserListItemDto) {
    const ref = this.dialog.open<ChangePasswordDialogComponent, ChangePasswordDialogData>(ChangePasswordDialogComponent, {
      data: { userFullName: getUserFullName(row) }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.changePassword(row.id, result).subscribe({
        next: () => {
          this.snack.open('رمز عبور تغییر کرد.', 'بستن', { duration: 2000 });
        }
      });
    });
  }

  confirmDelete(row: UserListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف کاربر',
        message: `"${getUserFullName(row)}" حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.delete(row.id).subscribe({
        next: () => {
          this.snack.open('کاربر حذف شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }
}
