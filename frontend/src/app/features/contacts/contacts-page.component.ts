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
import { ContactsService } from '../../core/services/contacts.service';
import { ContactListItemDto, ListContactsQuery, getContactType } from '../../core/models/contact.models';
import { BranchesService } from '../../core/services/branches.service';
import { BranchListItemDto } from '../../core/models/branch.models';
import { ContactFormDialogComponent, ContactFormDialogData } from './contact-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-contacts-page',
  imports: [FilterPanelComponent, AgGridAngular, GridPaginatorComponent,
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, ...APP_ICON_IMPORTS, MatDialogModule, PagedGridDirective, HasPermissionDirective
  ],
  template: `
    <div class="toolbar">
      <span class="title">مشتری‌ها و طرف‌حساب‌ها</span>
      <span class="spacer"></span>
    
<button *appHasPermission="'Contact.Create'" mat-stroked-button color="primary" (click)="openCreate()">
        <mat-icon [svgIcon]="'add'"></mat-icon>
        طرف حساب جدید
      </button>
</div>

    <app-filter-panel (apply)="apply()" (reset)="reset()">
<mat-form-field appearance="outline">
        <mat-label>جستجو (شماره اشتراک، نام یا تلفن)</mat-label>
        <input matInput [(ngModel)]="filters.search" />
      </mat-form-field>
      <mat-form-field *appHasPermission="'Branch.Read'" appearance="outline" class="branch-field">
        <mat-label>شعبه</mat-label>
        <mat-select [(ngModel)]="filters.branchId">
          <mat-option [value]="null">همه شعبه‌ها</mat-option>
          @for (b of branches; track b.id) {
            <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>نوع</mat-label>
        <mat-select [(ngModel)]="typeFilter">
          <mat-option [value]="null">همه</mat-option>
          <mat-option value="isCustomer">مشتری</mat-option>
          <mat-option value="isVendor">تأمین‌کننده</mat-option>
          <mat-option value="isEmployee">کارمند</mat-option>
          <mat-option value="isRetail">خرده‌فروشی</mat-option>
        </mat-select>
      </mat-form-field>

</app-filter-panel>

    <div class="grid-heading"><h2>طرف‌های حساب</h2><button mat-stroked-button type="button" (click)="grid.reload()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی</button></div>
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
export class ContactsPageComponent {
  sortWhitelist = ['code', 'name'];
  branches: BranchListItemDto[] = [];

  filters: { search: string | null; branchId: number | null } = { search: null, branchId: null };
  typeFilter: 'isCustomer' | 'isVendor' | 'isEmployee' | 'isRetail' | null = null;

  colDefs: ColDef<ContactListItemDto>[] = [
    { field: 'subscriptionNumber', headerName: 'شماره اشتراک', sortable: false, minWidth:130, pinned:'right',valueGetter:p=>p.data?.subscriptionNumber ?? ('AUTO-' + String(p.data?.id ?? '').padStart(6,'0')) },
    { field: 'code', headerName: 'کد', sortable: true, minWidth: 130 },
    { field: 'name', headerName: 'نام / عنوان', sortable: true, minWidth: 220 },
    { field: 'branchId', headerName: 'شناسه شعبه', sortable: false, maxWidth: 100 },
    { headerName: 'نوع', colId:'contactRole', sortable: false, minWidth: 180, valueGetter: p => p.data ? getContactType(p.data) : '' },
    { field: 'email', headerName: 'ایمیل', sortable: false, minWidth: 180 },
    { field: 'createdAtUtc', headerName: 'زمان ایجاد', sortable: false, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('fa-IR') : '' },
    {
      headerName: '', colId: 'actions', width: 100, pinned: 'left',
      sortable: false, filter: false, suppressHeaderMenuButton: true,
      cellRenderer: EntityActionsCell
    }
  ];

  gridContext: EntityActionsContext<ContactListItemDto> = {
    onEdit: (row) => this.openEdit(row),
    onDelete: (row) => this.confirmDelete(row),
    updatePermission: 'Contact.Update',
    deletePermission: 'Contact.Delete'
  };

  @ViewChild('grid') grid!: PagedGridDirective<ContactListItemDto>;

  constructor(
    private service: ContactsService,
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
    const query: ListContactsQuery = {
      ...q,
      search: (this.filters.search ?? '').trim() || null,
      branchId: this.filters.branchId,
      isCustomer: this.typeFilter === 'isCustomer' ? true : null,
      isVendor: this.typeFilter === 'isVendor' ? true : null,
      isEmployee: this.typeFilter === 'isEmployee' ? true : null,
      isRetail: this.typeFilter === 'isRetail' ? true : null
    };
    return this.service.list(query);
  };

  apply() { this.grid.reload(); }
  reset() {
    this.filters = { search: null, branchId: null };
    this.typeFilter = null;
    this.grid.reload();
  }

  openCreate() {
    const ref = this.dialog.open<ContactFormDialogComponent, ContactFormDialogData>(ContactFormDialogComponent, {
      width:'680px', data: { contact: null, defaultBranchId: this.filters.branchId }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snack.open('طرف حساب ایجاد شد.', 'بستن', { duration: 2000 });
          this.grid.reload();
        }
      });
    });
  }

  openEdit(row: ContactListItemDto) {
    this.service.getById(row.id).subscribe(full => {
      const ref = this.dialog.open<ContactFormDialogComponent, ContactFormDialogData>(ContactFormDialogComponent, {
        width:'680px', data: { contact: full, defaultBranchId: full.branchId }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(full.id, {
          id: full.id,
          rowVersion: full.rowVersion,
          ...result
        }).subscribe({
          next: () => {
            this.snack.open('طرف حساب به‌روزرسانی شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }

  confirmDelete(row: ContactListItemDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'حذف طرف حساب',
        message: `"${row.name}" حذف شود؟`,
        danger: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.service.getById(row.id).subscribe(full => {
        this.service.delete(row.id, full.rowVersion).subscribe({
          next: () => {
            this.snack.open('طرف حساب حذف شد.', 'بستن', { duration: 2000 });
            this.grid.reload();
          }
        });
      });
    });
  }
}
