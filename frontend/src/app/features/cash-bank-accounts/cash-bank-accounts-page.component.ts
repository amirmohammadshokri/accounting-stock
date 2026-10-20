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
import { EntityActionsCell, EntityActionsContext } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PermissionService } from '../../core/services/permission.service';
import { CashBankAccountsService } from '../../core/services/cash-bank-accounts.service';
import {
  CashBankAccountListItemDto,
  ListCashBankAccountsQuery,
  CashBankAccountType,
  getAccountTypeDisplayName
} from '../../core/models/cash-bank-account.models';
import { BranchesService } from '../../core/services/branches.service';
import { BranchListItemDto } from '../../core/models/branch.models';
import { CashBankAccountFormDialogComponent, CashBankAccountFormDialogData } from './cash-bank-account-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-cash-bank-accounts-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">صندوق و حساب‌های بانکی</span>
      <span class="spacer"></span>
      <button *appHasPermission="'CashBankAccount.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        حساب جدید
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
      <mat-form-field appearance="outline">
        <mat-label>نوع</mat-label>
        <mat-select [(ngModel)]="type">
          <mat-option [value]="null">همه</mat-option>
          <mat-option [value]="CashBankAccountType.Cash">صندوق</mat-option>
          <mat-option [value]="CashBankAccountType.Bank">بانک</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>جستجو (کد/نام)</mat-label>
        <input matInput [(ngModel)]="search">
      </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>حساب‌های صندوق و بانک</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
export class CashBankAccountsPageComponent {
  sortWhitelist = ['name', 'type'];
  CashBankAccountType = CashBankAccountType;

  branchId: number | null = null;
  type: CashBankAccountType | null = null;
  search: string | null = null;
  branches: BranchListItemDto[] = [];

  colDefs: ColDef<CashBankAccountListItemDto>[] = [
    { field: 'code', headerName: 'کد', sortable: false, minWidth: 130 },
    { field: 'name', headerName: 'نام', sortable: true, minWidth: 200 },
    { headerName: 'نوع', sortable: true, colId: 'type', minWidth: 100, valueGetter: p => p.data ? getAccountTypeDisplayName(p.data.type) : '' },
    { field: 'iban', headerName: 'شماره شبا', sortable: false, minWidth: 200 },
    { field: 'currency', headerName: 'ارز', sortable: false, maxWidth: 90 },
    { field: 'balance', headerName: 'مانده', sortable: false, type: 'rightAligned', minWidth: 130 },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<CashBankAccountListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'CashBankAccount.Update',
    deletePermission: 'CashBankAccount.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<CashBankAccountListItemDto>;

  constructor(
    private service: CashBankAccountsService,
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
    const query: ListCashBankAccountsQuery = {
      ...q,
      branchId: this.branchId,
      type: this.type,
      search: (this.search ?? '').trim() || null
    };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() { this.branchId = null; this.type = null; this.search = null; this.grid.reload(); }

  openCreate() {
    const ref = this.dialog.open<CashBankAccountFormDialogComponent, CashBankAccountFormDialogData>(CashBankAccountFormDialogComponent, {
      data: { account: null }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('حساب ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: CashBankAccountListItemDto) {
    this.service.getById(row.id).subscribe(full => {
      const ref = this.dialog.open<CashBankAccountFormDialogComponent, CashBankAccountFormDialogData>(CashBankAccountFormDialogComponent, {
        data: { account: full }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(full.id, {
          id: full.id,
          rowVersion: full.rowVersion,
          ...result
        }).subscribe({
          next: () => {
            this.snack.open('حساب به‌روزرسانی شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }

  confirmDelete(row: CashBankAccountListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف حساب',
        message: `"${row.name}" (${row.code}) حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.getById(row.id).subscribe(full => {
        this.service.delete(row.id, full.rowVersion).subscribe({
          next: () => {
            this.snack.open('حساب حذف شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }
}
