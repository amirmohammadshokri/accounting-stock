import { PersianPipe } from '../../shared/persian.pipe';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RoleDetailDto, PERMISSION_GROUPS } from '../../core/models/role.models';

export interface RoleFormDialogData {
  role: RoleDetailDto | null;    // null => oluştur
}

@Component({
  standalone: true,
  selector: 'app-role-form-dialog',
  imports: [PersianPipe,
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.role ? 'ویرایش نقش' : 'نقش جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>نام نقش</mat-label>
          <input matInput formControlName="name" maxlength="100" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>شرح (اختیاری)</mat-label>
          <input matInput formControlName="description" maxlength="256" />
        </mat-form-field>

        <div class="permissions">
          <div class="permissions-header">
            <span>مجوزها ({{ selected.size | persian }} انتخاب‌شده)</span>
          </div>
          @for (group of groups; track group.label) {
            <div class="group">
              <div class="group-title">
                <mat-checkbox
                  [checked]="isGroupFullySelected(group.permissions)"
                  [indeterminate]="isGroupPartiallySelected(group.permissions)"
                  (change)="toggleGroup(group.permissions, $event.checked)">
                  {{ group.label }}
                </mat-checkbox>
              </div>
              <div class="group-items">
                @for (p of group.permissions; track p) {
                  <mat-checkbox
                    [checked]="selected.has(p)"
                    (change)="togglePermission(p, $event.checked)">
                    {{ p | persian:'permission' }}
                  </mat-checkbox>
                }
              </div>
            </div>
          }
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid || selected.size === 0">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:480px; max-width:560px; padding-top:8px; }
    .permissions { border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 10px 12px; max-height: 360px; overflow-y: auto; }
    .permissions-header { font-weight: 600; margin-bottom: 6px; }
    .group { margin-bottom: 8px; }
    .group-title { font-weight: 500; }
    .group-items { display: flex; flex-direction: column; gap: 2px; padding-inline-start: 28px; }
    .group-items mat-checkbox { font-size: 0.9em; }
  `]
})
export class RoleFormDialogComponent {
  dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
  data = inject<RoleFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  groups = PERMISSION_GROUPS;
  selected = new Set<string>(this.data.role?.permissions ?? []);

  form = this.fb.group({
    name: [this.data.role?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [this.data.role?.description ?? '']
  });

  isGroupFullySelected(permissions: string[]): boolean {
    return permissions.every(p => this.selected.has(p));
  }

  isGroupPartiallySelected(permissions: string[]): boolean {
    const count = permissions.filter(p => this.selected.has(p)).length;
    return count > 0 && count < permissions.length;
  }

  toggleGroup(permissions: string[], checked: boolean) {
    for (const p of permissions) {
      if (checked) this.selected.add(p); else this.selected.delete(p);
    }
  }

  togglePermission(permission: string, checked: boolean) {
    if (checked) this.selected.add(permission); else this.selected.delete(permission);
  }

  save() {
    if (this.form.invalid || this.selected.size === 0) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      name: v.name!,
      description: v.description || null,
      permissions: Array.from(this.selected)
    });
  }
}
