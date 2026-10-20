import { PersianPipe } from '../../shared/persian.pipe';
import { PersianNumberInputDirective } from '../../shared/directives/persian-number-input.directive';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EntityPickerComponent, LookupConfig, PickerOption } from '../../shared/entity-picker/entity-picker.component';
import { CONTACT_LOOKUP_COLUMNS, CONTACT_LOOKUP_SORT_WHITELIST, contactToOption } from '../../shared/entity-picker/lookup-configs';
import { ContactsService } from '../../core/services/contacts.service';
import { ContactListItemDto } from '../../core/models/contact.models';
import { ChequeType, ChequeDirection, CreateChequeBody } from '../../core/models/cheque.models';

export interface ChequeFormDialogData {
  // Bu ekranda düzenleme yok — backend'de UpdateChequeCommand hiç yok, sadece
  // durum değişikliği (UpdateStatus) mevcut. Dialog her zaman "oluştur" modunda.
}

@Component({
  standalone: true,
  selector: 'app-cheque-form-dialog',
  imports: [PersianPipe, PersianNumberInputDirective, PersianDateFieldComponent,
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, EntityPickerComponent
  ],
  template: `
    <h2 mat-dialog-title>چک / سفته جدید</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>جهت</mat-label>
            <mat-select formControlName="direction">
              <mat-option [value]="ChequeDirection.Inbound">دریافتی از مشتری</mat-option>
              <mat-option [value]="ChequeDirection.Outbound">پرداختی به تأمین‌کننده</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>نوع</mat-label>
            <mat-select formControlName="type">
              <mat-option [value]="ChequeType.Cheque">چک</mat-option>
              <mat-option [value]="ChequeType.PromissoryNote">سفته</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <app-entity-picker
          [label]="form.value.direction === ChequeDirection.Inbound ? 'طرف حساب (zorunlu)' : 'طرف حساب (اختیاری)'"
          [fetcher]="contactFetcher"
          [lookup]="contactLookup"
          [value]="form.value.contactId ?? null"
          [width]="'100%'"
          (valueChange)="onContactSelected($event)">
        </app-entity-picker>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>شماره چک / سفته</mat-label>
            <input matInput formControlName="chequeNumber" maxlength="50" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>مبلغ</mat-label>
            <input persianNumber="string" matInput formControlName="amount" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>واحد پول</mat-label>
            <input matInput readonly [value]="form.controls.currency.value | persian:'currency'">
          </mat-form-field>
        </div>

        <div class="row">
          <app-persian-date-field label="تاریخ صدور" mode="date" formControlName="issueDate"></app-persian-date-field>

          <app-persian-date-field label="تاریخ سررسید" mode="date" formControlName="dueDate"></app-persian-date-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>نام بانک</mat-label>
            <input matInput formControlName="bankName" maxlength="100" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>شعبه بانک</mat-label>
            <input matInput formControlName="bankBranch" maxlength="100" />
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>شماره حساب</mat-label>
            <input matInput formControlName="accountNumber" maxlength="50" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>صادرکننده</mat-label>
            <input matInput formControlName="drawerName" maxlength="200" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>شرح</mat-label>
          <input matInput formControlName="description" maxlength="500" />
        </mat-form-field>

        <div class="form-error" *ngIf="formError">{{ formError }}</div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:10px; min-width:480px; padding-top:8px; }
    .row { display:flex; gap:10px; }
    .row mat-form-field { flex:1; min-width:0; }
    .form-error { color: var(--mat-sys-error, #b3261e); font-size: 0.85em; }
  `]
})
export class ChequeFormDialogComponent {
  dialogRef = inject(MatDialogRef<ChequeFormDialogComponent>);
  data = inject<ChequeFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private contactsService = inject(ContactsService);

  ChequeType = ChequeType;
  ChequeDirection = ChequeDirection;
  formError: string | null = null;

  form = this.fb.group({
    direction: [ChequeDirection.Inbound, Validators.required],
    type: [ChequeType.Cheque, Validators.required],
    contactId: [null as number | null],
    chequeNumber: ['', [Validators.required, Validators.maxLength(50)]],
    amount: ['', Validators.required],
    currency: ['IRR', Validators.required],
    issueDate: [this.todayInputValue(), Validators.required],
    dueDate: [this.todayInputValue(), Validators.required],
    bankName: [''],
    bankBranch: [''],
    accountNumber: [''],
    drawerName: [''],
    description: ['']
  });

  contactFetcher = (search: string): Observable<PickerOption[]> =>
    this.contactsService.list({ search: search || null, pageSize: 20 }).pipe(
      map(res => res.items.map(c => ({ id: c.id, label: c.customerNumber ?? c.code, sublabel: c.name })))
    );

  contactLookup: LookupConfig<ContactListItemDto> = {
    title: 'انتخاب طرف حساب',
    columns: CONTACT_LOOKUP_COLUMNS,
    sortWhitelist: CONTACT_LOOKUP_SORT_WHITELIST,
    searchPlaceholder: 'با شماره مشتری، نام یا تلفن جستجو کنید…',
    fetcher: (q) => this.contactsService.list(q),
    toOption: contactToOption
  };

  onContactSelected(id: number | null) {
    this.form.patchValue({ contactId: id });
  }

  private todayInputValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  save() {
    this.formError = null;
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const direction = Number(v.direction) as ChequeDirection;

    if (direction === ChequeDirection.Inbound && !v.contactId) {
      this.formError = 'برای چک / سفته دریافتی، انتخاب طرف حساب الزامی است.';
      return;
    }

    const amount = (v.amount ?? '').toString().replace(',', '.').trim();
    if (!amount || Number(amount) <= 0) {
      this.formError = 'مبلغ باید بیشتر از صفر باشد.';
      return;
    }

    if (v.dueDate! < v.issueDate!) {
      this.formError = 'تاریخ سررسید نباید قبل از تاریخ صدور باشد.';
      return;
    }

    const body: CreateChequeBody = {
      contactId: v.contactId ?? null,
      type: Number(v.type) as ChequeType,
      direction,
      chequeNumber: v.chequeNumber!.trim(),
      issueDate: this.dateInputToUtcIso(v.issueDate!),
      dueDate: this.dateInputToUtcIso(v.dueDate!),
      amount,
      currency: v.currency!,
      bankName: v.bankName || null,
      bankBranch: v.bankBranch || null,
      accountNumber: v.accountNumber || null,
      drawerName: v.drawerName || null,
      description: v.description || null
    };

    this.dialogRef.close(body);
  }

  private dateInputToUtcIso(dateStr: string): string {
    return new Date(`${dateStr}T00:00:00Z`).toISOString();
  }
}
