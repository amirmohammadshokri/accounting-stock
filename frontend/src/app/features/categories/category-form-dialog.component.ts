import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CategoryListItemDto } from '../../core/models/category.models';

export interface CategoryFormDialogData {
  category: CategoryListItemDto | null; // null => oluştur
}

@Component({
  standalone: true,
  selector: 'app-category-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>نام</mat-label>
          <input matInput formControlName="name" maxlength="100" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>شرح (اختیاری)</mat-label>
          <input matInput formControlName="description" maxlength="500" />
        </mat-form-field>
        <div class="color-row">
          <mat-form-field appearance="outline">
            <mat-label>رنگ (اختیاری)</mat-label>
            <input matInput formControlName="color" maxlength="20" placeholder="#FF5733" />
          </mat-form-field>
          <div class="swatch" *ngIf="form.value.color" [style.background]="form.value.color!"></div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:360px; padding-top:8px; }
    .color-row { display:flex; align-items:center; gap:10px; }
    .color-row mat-form-field { flex:1; }
    .swatch { width:28px; height:28px; border-radius:4px; border:1px solid rgba(0,0,0,.2); }
  `]
})
export class CategoryFormDialogComponent {
  dialogRef = inject(MatDialogRef<CategoryFormDialogComponent>);
  data = inject<CategoryFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: [this.data.category?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [this.data.category?.description ?? '', [Validators.maxLength(500)]],
    color: [this.data.category?.color ?? '', [Validators.maxLength(20)]]
  });

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      name: v.name!,
      description: v.description || null,
      color: v.color || null
    });
  }
}
