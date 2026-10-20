import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { RouterModule } from '@angular/router';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { latinDigits } from '../../core/utils/persian.utils';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { BranchesService } from '../../core/services/branches.service';
import { BranchListItemDto } from '../../core/models/branch.models';
import { ContactDto } from '../../core/models/contact.models';

export interface ContactFormDialogData {
  contact: ContactDto | null; // null => oluştur
  defaultBranchId: number | null;
}

type ContactKind = 'company' | 'person' | 'both';

@Component({
  standalone: true,
  selector: 'app-contact-form-dialog',
  imports: [RouterModule, HasPermissionDirective,
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatButtonModule, MatButtonToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{data.contact ? 'ویرایش طرف حساب' : 'طرف حساب جدید'}}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div class="identity-selector"><mat-form-field appearance="outline"><mat-label>این طرف حساب شخص است یا شرکت؟</mat-label><mat-select [value]="kind" (selectionChange)="kind=$event.value;onKindChange()" aria-label="نوع طرف حساب"><mat-option value="person">شخص حقیقی</mat-option><mat-option value="company">شرکت / مجموعه</mat-option><mat-option *ngIf="hasBothDetails" value="both">شخص صاحب کسب‌وکار (اطلاعات شخص و شرکت)</mat-option></mat-select></mat-form-field>
        <div class="customer-number">شناسه داخلی: <strong dir="ltr">{{data.contact?.customerNumber || (data.contact ? data.contact.id.toString().padStart(6,'0') : 'پس از ذخیره صادر می‌شود')}}</strong></div>
      </div>
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline"><mat-label>شماره اشتراک (اختیاری)</mat-label><input matInput formControlName="subscriptionNumber" [placeholder]="data.contact?.subscriptionNumber || 'مثلاً VIP-1001'" maxlength="32" dir="ltr" (input)="normalizeSubscription($event)"><mat-hint>خالی بگذارید تا شماره خودکار صادر شود؛ مثلاً 1001 یا VIP-12</mat-hint><mat-error>حداکثر ۳۲ حرف انگلیسی، عدد یا خط تیره؛ پیشوند AUTO- رزرو است.</mat-error></mat-form-field>
        @if(kind!=='person'){<mat-form-field appearance="outline"><mat-label>نام شرکت / مجموعه</mat-label><input matInput formControlName="name" maxlength="200"><mat-error>نام شرکت را وارد کنید.</mat-error></mat-form-field>}
        @if(kind!=='company'){<div class="row"><mat-form-field appearance="outline"><mat-label>نام</mat-label><input matInput formControlName="firstName" maxlength="100"><mat-error>نام را وارد کنید.</mat-error></mat-form-field><mat-form-field appearance="outline"><mat-label>نام خانوادگی</mat-label><input matInput formControlName="lastName" maxlength="100"><mat-error>نام خانوادگی را وارد کنید.</mat-error></mat-form-field></div>}
        <div class="row"><mat-form-field appearance="outline"><mat-label>شماره تماس</mat-label><input matInput formControlName="phone" type="tel" maxlength="40"></mat-form-field><mat-form-field appearance="outline"><mat-label>شعبه</mat-label><mat-select formControlName="branchId">@for(b of branches;track b.id){<mat-option [value]="b.id">{{b.name}}</mat-option>}</mat-select><mat-error>شعبه را انتخاب کنید.</mat-error></mat-form-field></div>
        <p *ngIf="branchError" class="form-error">دریافت شعبه‌ها ناموفق بود. <button mat-button type="button" (click)="loadBranches()">تلاش دوباره</button></p>
        <mat-form-field appearance="outline"><mat-label>نشانی (اختیاری)</mat-label><textarea matInput formControlName="address" rows="2" maxlength="500"></textarea></mat-form-field>
        <div class="flags"><span>نقش طرف حساب:</span><mat-checkbox formControlName="isCustomer">مشتری</mat-checkbox><mat-checkbox formControlName="isVendor">تأمین‌کننده</mat-checkbox><mat-checkbox formControlName="isEmployee" (change)="onEmployeeChange($event.checked)">کارمند</mat-checkbox></div>
        <details class="extra"><summary>اطلاعات تکمیلی و بانکی (اختیاری)</summary>
          <div class="row"><mat-form-field appearance="outline"><mat-label>{{kind==='company' ? 'شناسه ملی شرکت' : 'کد ملی'}}</mat-label><input matInput formControlName="nationalId" inputmode="numeric" (input)="form.controls.nationalId.setValue(latinDigits($any($event.target).value))" maxlength="11"><mat-error>۱۰ رقم برای شخص یا ۱۱ رقم برای شرکت وارد کنید.</mat-error></mat-form-field><mat-form-field appearance="outline"><mat-label>کدپستی</mat-label><input matInput formControlName="postalCode" inputmode="numeric" (input)="form.controls.postalCode.setValue(latinDigits($any($event.target).value))" maxlength="10"><mat-error>کدپستی باید ۱۰ رقم باشد.</mat-error></mat-form-field></div>
          @if(kind!=='person'){<div class="row"><mat-form-field appearance="outline"><mat-label>شماره اقتصادی</mat-label><input matInput formControlName="taxNumber" maxlength="20"></mat-form-field><mat-form-field appearance="outline"><mat-label>حوزه مالیاتی</mat-label><input matInput formControlName="taxOffice" maxlength="100"></mat-form-field></div><div class="row"><mat-form-field appearance="outline"><mat-label>شناسه ثبت شرکت</mat-label><input matInput formControlName="mersisNo" maxlength="20"></mat-form-field><mat-form-field appearance="outline"><mat-label>شماره ثبت</mat-label><input matInput formControlName="ticaretSicilNo" maxlength="20"></mat-form-field></div>}
          <div class="row"><mat-form-field appearance="outline"><mat-label>شهر</mat-label><input matInput formControlName="city" maxlength="200"></mat-form-field><mat-form-field appearance="outline"><mat-label>منطقه</mat-label><input matInput formControlName="district" maxlength="200"></mat-form-field></div>
          <mat-form-field appearance="outline"><mat-label>ایمیل</mat-label><input matInput formControlName="email" type="email" maxlength="320"><mat-error>ایمیل معتبر وارد کنید.</mat-error></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>شماره شبا</mat-label><input matInput formControlName="iban" maxlength="34" dir="ltr"></mat-form-field>
          @if(kind!=='company'){<div class="row"><mat-form-field appearance="outline"><mat-label>عنوان شغلی</mat-label><input matInput formControlName="title" maxlength="100"></mat-form-field><mat-form-field appearance="outline"><mat-label>واحد سازمانی</mat-label><input matInput formControlName="department" maxlength="100"></mat-form-field></div>}
          <mat-checkbox formControlName="isRetail" (change)="onRetailChange($event.checked)">مشتری خرده‌فروشی</mat-checkbox>
        </details>
        <p *ngIf="formError" class="form-error" role="alert">{{formError}}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">@if(data.contact){<a *appHasPermission="'Contact.Read'" mat-button routerLink="/opening-balances" [queryParams]="{tab:'contacts',contactId:data.contact.id}" (click)="dialogRef.close(null)">مانده اول دوره</a>}<button type="button" mat-button (click)="dialogRef.close(null)">بستن</button><button type="submit" mat-flat-button>ذخیره طرف حساب</button></mat-dialog-actions>
    </form>
  `,
  styles:[`.identity-selector{padding:18px 24px 12px;border-bottom:1px solid #e1e9e5;background:#f7faf9}.identity-selector mat-form-field{width:100%;margin-bottom:0}.customer-number{font-size:12px;color:#526d64}.fields{display:flex;flex-direction:column;gap:12px;min-width:0}.row{display:flex;gap:12px}.row mat-form-field{flex:1;min-width:0}.flags{display:flex;align-items:center;gap:6px 12px;flex-wrap:wrap}.flags>span{font-size:12px}.extra{border:1px solid #dbe5e0;border-radius:12px;padding:12px}.extra summary{cursor:pointer;color:#29634f;margin-bottom:12px}.extra mat-form-field{width:100%}.form-error{font-size:12px}@media(max-width:600px){.row{flex-wrap:wrap}.row mat-form-field{flex-basis:100%}}`]
})
export class ContactFormDialogComponent {
  dialogRef = inject(MatDialogRef<ContactFormDialogComponent>);
  data = inject<ContactFormDialogData>(MAT_DIALOG_DATA);
  readonly latinDigits = latinDigits;
  private fb = inject(FormBuilder);
  private branchesService = inject(BranchesService);
  private auth = inject(AuthService);
  private permissions = inject(PermissionService);
  branchError=false;formError='';
  hasBothDetails=!!this.data.contact?.personDetails && !!this.data.contact?.companyDetails;

  branches: BranchListItemDto[] = [];
  kind: ContactKind = this.hasBothDetails ? 'both' : this.data.contact?.companyDetails ? 'company' : 'person';

  form = this.fb.group({
    subscriptionNumber: [this.data.contact?.subscriptionNumber?.startsWith('AUTO-') ? '' : this.data.contact?.subscriptionNumber ?? '', [Validators.maxLength(32), Validators.pattern(/^(?!AUTO-)[A-Z0-9-]*$/)]],
    branchId: [this.data.contact?.branchId ?? this.data.defaultBranchId ?? this.auth.currentUser()?.branchId, Validators.required],
    name: [this.data.contact?.name ?? '', [Validators.maxLength(200)]],
    taxNumber: [this.data.contact?.companyDetails?.taxNumber ?? '', [Validators.maxLength(20)]],
    taxOffice: [this.data.contact?.companyDetails?.taxOffice ?? '', [Validators.maxLength(100)]],
    mersisNo: [this.data.contact?.companyDetails?.mersisNo ?? '', [Validators.maxLength(20)]],
    ticaretSicilNo: [this.data.contact?.companyDetails?.ticaretSicilNo ?? '', [Validators.maxLength(20)]],
    tckn: [this.data.contact?.personDetails?.tckn ?? '', [Validators.maxLength(10)]],
    firstName: [this.data.contact?.personDetails?.firstName ?? '', [Validators.maxLength(100)]],
    lastName: [this.data.contact?.personDetails?.lastName ?? '', [Validators.maxLength(100)]],
    title: [this.data.contact?.personDetails?.title ?? '', [Validators.maxLength(100)]],
    department: [this.data.contact?.personDetails?.department ?? '', [Validators.maxLength(100)]],
    nationalId: [this.data.contact?.nationalId ?? '', [Validators.pattern(/^[0-9]{10,11}$/)]],
    postalCode: [this.data.contact?.postalCode ?? '', [Validators.pattern(/^[0-9]{10}$/)]],
    address: [this.data.contact?.address ?? '', [Validators.maxLength(500)]],
    city: [this.data.contact?.city ?? '', [Validators.maxLength(200)]],
    district: [this.data.contact?.district ?? '', [Validators.maxLength(200)]],
    email: [this.data.contact?.email ?? '', [Validators.email, Validators.maxLength(320)]],
    phone: [this.data.contact?.phone ?? '', [Validators.maxLength(40)]],
    iban: [this.data.contact?.iban ?? '', [Validators.maxLength(34)]],
    isCustomer: [this.data.contact?.isCustomer ?? true],
    isVendor: [this.data.contact?.isVendor ?? false],
    isEmployee: [this.data.contact?.isEmployee ?? false],
    isRetail: [this.data.contact?.isRetail ?? false]
  });

  constructor() {
    this.loadBranches();
    this.applyKindValidators();
  }

  onRetailChange(checked: boolean) {
    if (checked) this.form.patchValue({ isCustomer: false });
  }

  onKindChange(): void {
    if(this.kind==='company')this.form.controls.isEmployee.setValue(false);
    this.applyKindValidators();
  }

  loadBranches(): void {
    this.branchError=false;
    if (!this.permissions.has('Branch.Read')) { const id=this.form.controls.branchId.value;this.branches=id ? [{id,code:'',name:'شعبه شما'}] : [];return; }
    this.branchesService.list().subscribe({next:res=>{this.branches=res;if(!this.form.controls.branchId.value&&res.length===1)this.form.controls.branchId.setValue(res[0].id);},error:()=>this.branchError=true});
  }
  onEmployeeChange(checked:boolean):void {if(checked&&this.kind==='company'){this.kind='person';this.applyKindValidators();}}
  private applyKindValidators(): void {
    this.form.controls.name.setValidators(this.kind!=='person' ? [Validators.required,Validators.maxLength(200)] : [Validators.maxLength(200)]);
    this.form.controls.taxNumber.setValidators([Validators.maxLength(20)]);
    this.form.controls.taxOffice.setValidators([Validators.maxLength(100)]);
    this.form.controls.tckn.setValidators([Validators.pattern(/^[0-9]{10}$/)]);
    for(const key of ['firstName','lastName'] as const) this.form.controls[key].setValidators(this.kind!=='company' ? [Validators.required,Validators.maxLength(100)] : [Validators.maxLength(100)]);
    for(const key of ['name','taxNumber','taxOffice','tckn','firstName','lastName'] as const)this.form.controls[key].updateValueAndValidity();
    this.formError='';
  }

  normalizeSubscription(event: Event): void { this.form.controls.subscriptionNumber.setValue(latinDigits((event.target as HTMLInputElement).value).toUpperCase()); }

  save() {
    if(this.form.invalid){this.form.markAllAsTouched();this.formError='نام، نوع طرف حساب، شعبه و اطلاعات واردشده را بررسی کنید.';return;}
    const v = this.form.getRawValue();

    const result = {
      branchId: v.branchId!,
      subscriptionNumber: v.subscriptionNumber?.trim() || null,
      name: this.kind !== 'person' ? (v.name || '') : `${v.firstName} ${v.lastName}`.trim(),
      isCustomer: !!v.isCustomer && !v.isRetail,
      isVendor: !!v.isVendor,
      isEmployee: !!v.isEmployee,
      isRetail: !!v.isRetail,
      email: v.email || null,
      nationalId: v.nationalId || null,
      postalCode: v.postalCode || null,
      address: v.address || null,
      city: v.city || null,
      district: v.district || null,
      phone: v.phone || null,
      iban: v.iban || null,
      companyDetails: this.kind !== 'person' ? {
        taxNumber: v.taxNumber || null,
        taxOffice: v.taxOffice || null,
        mersisNo: v.mersisNo || null,
        ticaretSicilNo: v.ticaretSicilNo || null
      } : null,
      personDetails: this.kind !== 'company' ? {
        tckn: v.nationalId?.length===10 ? v.nationalId : v.tckn || null,
        firstName: v.firstName || '',
        lastName: v.lastName || '',
        title: v.title || null,
        department: v.department || null
      } : null
    };

    this.dialogRef.close(result);
  }
}
