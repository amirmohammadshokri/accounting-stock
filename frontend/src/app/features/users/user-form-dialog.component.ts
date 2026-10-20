import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserDetailDto } from '../../core/models/user.models';
import { RoleListItemDto } from '../../core/models/role.models';
import { BranchListItemDto } from '../../core/models/branch.models';

export interface UserFormDialogData {
  user: UserDetailDto | null;    // null => oluştur
  branches: BranchListItemDto[];
  roles: RoleListItemDto[];
}

@Component({
  standalone: true,
  selector: 'app-user-form-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.user ? 'ویرایش کاربر' : 'کاربر جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>نام</mat-label>
            <input matInput formControlName="firstName" maxlength="100" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>نام خانوادگی</mat-label>
            <input matInput formControlName="lastName" maxlength="100" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>ایمیل</mat-label>
          <input matInput formControlName="email" type="email" maxlength="255" />
        </mat-form-field>

        @if (!data.user) {
          <mat-form-field appearance="outline">
            <mat-label>رمز عبور</mat-label>
            <input matInput formControlName="password" type="password" />
            <mat-hint>حداقل ۸ نویسه شامل حروف بزرگ و کوچک لاتین و عدد</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>شعبه (اختیاری)</mat-label>
          <mat-select formControlName="branchId">
            <mat-option [value]="null">بدون شعبه (مرکزی)</mat-option>
            @for (b of data.branches; track b.id) {
              <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>نقش‌ها</mat-label>
          <mat-select formControlName="roleIds" multiple>
            @for (r of data.roles; track r.id) {
              <mat-option [value]="r.id">{{ r.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive">فعال</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:420px; padding-top:8px; }
    .row { display:flex; gap:10px; }
    .row mat-form-field { flex:1; }
  `]
})
export class UserFormDialogComponent {
  dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    firstName: [this.data.user?.firstName ?? '', [Validators.required, Validators.maxLength(100)]],
    lastName: [this.data.user?.lastName ?? '', [Validators.required, Validators.maxLength(100)]],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    password: ['', this.data.user ? [] : [Validators.required, Validators.minLength(8)]],
    branchId: [this.data.user?.branchId ?? null],
    roleIds: [this.initialRoleIds(), Validators.required],
    isActive: [this.data.user?.isActive ?? true]
  });

  private initialRoleIds(): number[] {
    if (!this.data.user) return [];
    const names = new Set(this.data.user.roles);
    return this.data.roles.filter(r => names.has(r.name)).map(r => r.id);
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (this.data.user) {
      this.dialogRef.close({
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        branchId: v.branchId ?? null,
        roleIds: v.roleIds!,
        isActive: v.isActive!
      });
    } else {
      this.dialogRef.close({
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        password: v.password!,
        branchId: v.branchId ?? null,
        roleIds: v.roleIds!,
        isActive: v.isActive!
      });
    }
  }
}
