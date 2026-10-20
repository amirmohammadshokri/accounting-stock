import { PersianNumberInputDirective } from '../../shared/directives/persian-number-input.directive';
import { PersianPipe } from '../../shared/persian.pipe';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Observable, map } from 'rxjs';
import { EntityPickerComponent, LookupConfig, PickerOption } from '../../shared/entity-picker/entity-picker.component';
import {
  CASH_BANK_ACCOUNT_LOOKUP_COLUMNS, CASH_BANK_ACCOUNT_LOOKUP_SORT_WHITELIST, cashBankAccountToOption,
  CONTACT_LOOKUP_COLUMNS, CONTACT_LOOKUP_SORT_WHITELIST, contactToOption
} from '../../shared/entity-picker/lookup-configs';
import { CashBankAccountsService } from '../../core/services/cash-bank-accounts.service';
import { CashBankAccountListItemDto } from '../../core/models/cash-bank-account.models';
import { ContactsService } from '../../core/services/contacts.service';
import { ContactListItemDto } from '../../core/models/contact.models';
import {
  PaymentDetailDto,
  PaymentDirection,
  PAYMENT_CURRENCIES
} from '../../core/models/payment.models';

export interface PaymentFormDialogData {
  payment: PaymentDetailDto | null;  // null => oluştur
  accountLabel?: string | null;      // düzenlemede entity-picker'ın başlangıç etiketi (liste satırından: "KOD - Ad")
  contactLabel?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-payment-form-dialog',
  imports: [PersianNumberInputDirective, PersianPipe, PersianDateFieldComponent,
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, EntityPickerComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ data.payment ? 'ویرایش پرداخت' : 'پرداخت جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <app-entity-picker
          label="حساب صندوق / بانک"
          [fetcher]="accountFetcher"
          [lookup]="accountLookup"
          [value]="form.value.accountId ?? null"
          [initialLabel]="data.accountLabel ?? null"
          [width]="'100%'"
          (valueChange)="onAccountSelected($event)">
        </app-entity-picker>

        <app-entity-picker
          label="طرف حساب (اختیاری)"
          [fetcher]="contactFetcher"
          [lookup]="contactLookup"
          [value]="form.value.contactId ?? null"
          [initialLabel]="data.contactLabel ?? null"
          [width]="'100%'"
          (valueChange)="onContactSelected($event)">
        </app-entity-picker>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>نوع</mat-label>
            <mat-select formControlName="direction">
              <mat-option [value]="PaymentDirection.In">دریافت (ورودی)</mat-option>
              <mat-option [value]="PaymentDirection.Out">پرداخت (خروجی)</mat-option>
            </mat-select>
          </mat-form-field>
          <app-persian-date-field label="تاریخ" mode="datetime" formControlName="dateUtc"></app-persian-date-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>مبلغ</mat-label>
            <input persianNumber="string" matInput formControlName="amount" placeholder="۰٫۰۰" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>واحد پول</mat-label>
            <input matInput readonly [value]="form.controls.currency.value | persian:'currency'">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>شرح</mat-label>
          <input matInput formControlName="description" maxlength="256" />
        </mat-form-field>
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
export class PaymentFormDialogComponent {
  dialogRef = inject(MatDialogRef<PaymentFormDialogComponent>);
  data = inject<PaymentFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private cashBankAccountsService = inject(CashBankAccountsService);
  private contactsService = inject(ContactsService);

  PaymentDirection = PaymentDirection;


  form = this.fb.group({
    accountId: [this.data.payment?.accountId ?? null, Validators.required],
    contactId: [this.data.payment?.contactId ?? null],
    direction: [this.data.payment?.direction === 'Out' ? PaymentDirection.Out : PaymentDirection.In, Validators.required],
    dateUtc: [this.toLocalInputValue(this.data.payment?.dateUtc), Validators.required],
    amount: [this.data.payment?.amount ?? '', [Validators.required]],
    currency: [this.data.payment?.currency ?? 'IRR', Validators.required],
    description: ['']
  });

  accountFetcher = (search: string): Observable<PickerOption[]> =>
    this.cashBankAccountsService.list({ search: search || null, pageSize: 20 }).pipe(
      map(res => res.items.map(a => ({ id: a.id, label: a.code, sublabel: `${a.name} (${a.currency})` })))
    );

  contactFetcher = (search: string): Observable<PickerOption[]> =>
    this.contactsService.list({ search: search || null, pageSize: 20 }).pipe(
      map(res => res.items.map(c => ({ id: c.id, label: c.customerNumber ?? c.code, sublabel: c.name })))
    );

  accountLookup: LookupConfig<CashBankAccountListItemDto> = {
    title: 'انتخاب حساب صندوق و بانک',
    columns: CASH_BANK_ACCOUNT_LOOKUP_COLUMNS,
    sortWhitelist: CASH_BANK_ACCOUNT_LOOKUP_SORT_WHITELIST,
    searchPlaceholder: 'با کد یا نام جستجو کنید…',
    fetcher: (q) => this.cashBankAccountsService.list(q),
    toOption: cashBankAccountToOption
  };

  contactLookup: LookupConfig<ContactListItemDto> = {
    title: 'انتخاب طرف حساب',
    columns: CONTACT_LOOKUP_COLUMNS,
    sortWhitelist: CONTACT_LOOKUP_SORT_WHITELIST,
    searchPlaceholder: 'با شماره مشتری، نام یا تلفن جستجو کنید…',
    fetcher: (q) => this.contactsService.list(q),
    toOption: contactToOption
  };

  onAccountSelected(id: number | null) {
    this.form.patchValue({ accountId: id });
  }

  onContactSelected(id: number | null) {
    this.form.patchValue({ contactId: id });
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      accountId: Number(v.accountId),
      contactId: v.contactId ?? null,
      linkedInvoiceId: this.data.payment?.linkedInvoiceId ?? null,
      dateUtc: this.localToUtcIso(v.dateUtc!),
      direction: Number(v.direction),
      amount: String(v.amount).replace(',', '.').trim(),
      currency: v.currency!,
      description: v.description || null
    });
  }

  private toLocalInputValue(isoUtc?: string | null): string {
    const d = isoUtc ? new Date(isoUtc) : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  private localToUtcIso(localStr: string): string {
    return new Date(localStr).toISOString();
  }
}
