import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface ChangePasswordDialogData {
  userFullName: string;
}

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  standalone: true,
  selector: 'app-change-password-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>تغییر رمز عبور — {{ data.userFullName }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>رمز عبور جدید</mat-label>
          <input matInput formControlName="newPassword" type="password" />
          <mat-hint>حداقل ۸ نویسه شامل حروف بزرگ و کوچک لاتین و عدد</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>تکرار رمز عبور جدید</mat-label>
          <input matInput formControlName="confirmPassword" type="password" />
        </mat-form-field>
        @if (form.errors?.['mismatch']) {
          <div class="error">رمزهای عبور یکسان نیستند.</div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">تغییر</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:380px; padding-top:8px; }
    .error { color: var(--mat-sys-error, #b3261e); font-size: 0.85em; }
  `]
})
export class ChangePasswordDialogComponent {
  dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  data = inject<ChangePasswordDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close({ newPassword: this.form.value.newPassword! });
  }
}
