import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
@Component({standalone:true, imports:[FormsModule,MatDialogModule,MatButtonModule,MatFormFieldModule,MatInputModule], template:`
  <h2 mat-dialog-title>{{data.existing ? 'به‌روزرسانی پکیج' : 'ساخت پکیج غذا و خدمات'}}</h2>
  <mat-dialog-content>
    <p>ردیف‌های فعلی به عنوان محتویات یک پکیج ذخیره می‌شوند. تعداد هر ردیف، مقدار آن در یک پکیج است.</p>
    <mat-form-field appearance="outline"><mat-label>نام پکیج</mat-label><input matInput [(ngModel)]="name" maxlength="128"></mat-form-field>
    <p>سفارش‌ها و فاکتورهای قبلی با تغییر پکیج تغییر نمی‌کنند.</p>
  </mat-dialog-content>
  <mat-dialog-actions align="end"><button mat-button (click)="ref.close()">انصراف</button><button mat-flat-button [disabled]="!name.trim()" (click)="ref.close(name.trim())">ذخیره پکیج</button></mat-dialog-actions>
`})
export class PackageSaveDialogComponent {
  data = inject<{existing?:string}>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<PackageSaveDialogComponent>);
  name = this.data.existing ?? '';
}
