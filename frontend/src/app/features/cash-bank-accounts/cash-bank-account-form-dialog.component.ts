import { PersianPipe } from '../../shared/persian.pipe';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BranchesService } from '../../core/services/branches.service';
import { BranchListItemDto } from '../../core/models/branch.models';
import { CashBankAccountDetailDto, CashBankAccountType } from '../../core/models/cash-bank-account.models';

export interface CashBankAccountFormDialogData {
  account: CashBankAccountDetailDto | null; // null => oluştur
}

@Component({
  standalone: true,
  selector: 'app-cash-bank-account-form-dialog',
  imports: [PersianPipe,
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.account ? 'ویرایش حساب' : 'حساب جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <div class="readonly-info" *ngIf="data.account">
          کد: {{ data.account.code }} · واحد پول: {{ data.account.currency | persian:'currency' }} · مانده: {{ data.account.balance }}
        </div>

        <mat-form-field appearance="outline" *ngIf="!data.account">
          <mat-label>شعبه</mat-label>
          <mat-select formControlName="branchId">
            @for (b of branches; track b.id) {
              <mat-option [value]="b.id">{{ b.code }} - {{ b.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>نوع</mat-label>
          <mat-select formControlName="type">
            <mat-option [value]="CashBankAccountType.Cash">صندوق</mat-option>
            <mat-option [value]="CashBankAccountType.Bank">بانک</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>نام</mat-label>
          <input matInput formControlName="name" maxlength="160" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>شماره شبا (اختیاری)</mat-label>
          <input matInput formControlName="iban" maxlength="34" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:360px; padding-top:8px; }
    .readonly-info { font-size:12px; color:var(--mat-sys-on-surface-variant); margin-bottom:4px; }
  `]
})
export class CashBankAccountFormDialogComponent {
  dialogRef = inject(MatDialogRef<CashBankAccountFormDialogComponent>);
  data = inject<CashBankAccountFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private branchesService = inject(BranchesService);

  CashBankAccountType = CashBankAccountType;
  branches: BranchListItemDto[] = [];

  form = this.fb.group({
    branchId: [this.data.account?.branchId ?? null, this.data.account ? [] : [Validators.required]],
    type: [this.data.account?.type === 'Bank' ? CashBankAccountType.Bank : CashBankAccountType.Cash, Validators.required],
    name: [this.data.account?.name ?? '', [Validators.required, Validators.maxLength(160)]],
    iban: [this.data.account?.iban ?? '', [Validators.maxLength(34)]]
  });

  constructor() {
    if (!this.data.account) {
      this.branchesService.list().subscribe(res => (this.branches = res));
    }
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (this.data.account) {
      this.dialogRef.close({
        type: Number(v.type),
        name: v.name!,
        iban: v.iban || null
      });
    } else {
      this.dialogRef.close({
        branchId: Number(v.branchId),
        type: Number(v.type),
        name: v.name!,
        iban: v.iban || null
      });
    }
  }
}
