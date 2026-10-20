import { LogoUploadComponent } from '../../shared/logo-upload/logo-upload.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BranchDto } from '../../core/models/branch.models';

export interface BranchFormDialogData {
  branch: BranchDto | null; // null => oluştur
}

@Component({
  standalone: true,
  selector: 'app-branch-form-dialog',
  imports: [LogoUploadComponent,CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.branch ? 'ویرایش شعبه' : 'شعبه جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>کد</mat-label>
          <input matInput formControlName="code" maxlength="20" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>نام</mat-label>
          <input matInput formControlName="name" maxlength="100" />
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>نشانی شعبه</mat-label><textarea matInput formControlName="address" maxlength="500"></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>تلفن شعبه</mat-label><input matInput formControlName="phone" maxlength="50"></mat-form-field>
        <app-logo-upload formControlName="logoDataUrl"></app-logo-upload>
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
export class BranchFormDialogComponent {
  dialogRef = inject(MatDialogRef<BranchFormDialogComponent>);
  data = inject<BranchFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    logoDataUrl: this.fb.control<string | null>(this.data.branch?.logoDataUrl ?? null),
    address: [this.data.branch?.address ?? '', Validators.maxLength(500)],
    phone: [this.data.branch?.phone ?? '', Validators.maxLength(50)],
    code: [this.data.branch?.code ?? '', [Validators.required, Validators.maxLength(20)]],
    name: [this.data.branch?.name ?? '', [Validators.required, Validators.maxLength(100)]]
  });

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
