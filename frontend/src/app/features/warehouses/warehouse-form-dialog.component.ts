import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { BranchesService } from '../../core/services/branches.service';
import { BranchListItemDto } from '../../core/models/branch.models';
import { WarehouseDto } from '../../core/models/warehouse.models';

export interface WarehouseFormDialogData {
  warehouse: WarehouseDto | null; // null => oluştur
}

@Component({
  standalone: true,
  selector: 'app-warehouse-form-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.warehouse ? 'ویرایش انبار' : 'انبار جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>شعبه</mat-label>
          <mat-select formControlName="branchId">
            @for (b of branches; track b.id) {
              <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>کد</mat-label>
          <input matInput formControlName="code" maxlength="20" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>نام</mat-label>
          <input matInput formControlName="name" maxlength="100" />
        </mat-form-field>
        <mat-checkbox formControlName="isDefault">انبار پیش‌فرض</mat-checkbox>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:320px; padding-top:8px; }
  `]
})
export class WarehouseFormDialogComponent {
  dialogRef = inject(MatDialogRef<WarehouseFormDialogComponent>);
  data = inject<WarehouseFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private branchesService = inject(BranchesService);

  branches: BranchListItemDto[] = [];

  form = this.fb.group({
    branchId: [this.data.warehouse?.branchId ?? null, Validators.required],
    code: [this.data.warehouse?.code ?? '', [Validators.required, Validators.maxLength(20)]],
    name: [this.data.warehouse?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    isDefault: [this.data.warehouse?.isDefault ?? false]
  });

  constructor() {
    this.branchesService.list().subscribe(res => (this.branches = res));
  }

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
