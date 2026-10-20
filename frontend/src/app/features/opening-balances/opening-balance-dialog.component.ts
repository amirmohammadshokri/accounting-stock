import { Component,inject } from '@angular/core';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { MAT_DIALOG_DATA,MatDialogModule,MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { OpeningBalancesService } from '../../core/services/opening-balances.service';
import { OpeningBalance,OpeningBody,OpeningKind,OpeningReference,OpeningFilters } from '../../core/models/opening-balance.models';
import { openingDateValidator,openingDayToUtc,openingDecimalValidator,openingTotal,openingError } from '../../core/utils/opening-balance.utils';
import { formatPersianNumber } from '../../core/utils/persian.utils';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { PersianNumberInputDirective } from '../../shared/directives/persian-number-input.directive';
import { OpeningEntitySelectComponent } from './opening-entity-select.component';
export interface OpeningDialogData {kind:OpeningKind;row:OpeningBalance|null;date:string;contactId:number|null;itemId:number|null;warehouseId:number|null;contacts:OpeningReference[];items:OpeningReference[];warehouses:OpeningReference[];onConflict:()=>void;}
@Component({standalone:true,selector:'app-opening-balance-dialog',imports:[ReactiveFormsModule,MatDialogModule,MatFormFieldModule,MatInputModule,MatRadioModule,MatButtonModule,PersianDateFieldComponent,PersianNumberInputDirective,OpeningEntitySelectComponent],template:`
  <h2 mat-dialog-title>{{row ? 'ویرایش' : 'ثبت'}} {{data.kind==='contacts' ? 'مانده طرف حساب' : 'موجودی کالا'}} اول دوره</h2>
  <form [formGroup]="form" (ngSubmit)="save()"><mat-dialog-content class="fields">
    @if(error){<p role="alert" class="error">{{error}}</p>}
    @if(conflict){<button type="button" mat-stroked-button (click)="reloadLatest()" [disabled]="saving">بازخوانی آخرین نسخه برای بررسی</button>}
    @if(uncertain){<button type="button" mat-stroked-button (click)="verifyPrevious()" [disabled]="saving">بررسی نتیجه ثبت قبلی</button>}
    @if(data.kind==='contacts'){
      <app-opening-entity-select label="طرف حساب" [rows]="data.contacts" [value]="form.controls.contactId.value" (valueChange)="form.controls.contactId.setValue($event)" [disabled]="!!row || saving || uncertain"></app-opening-entity-select>
      <mat-radio-group formControlName="isDebit" aria-label="جهت مانده"><mat-radio-button [value]="true">طرف حساب به ما بدهکار است (طلب ما)</mat-radio-button><mat-radio-button [value]="false">ما به طرف حساب بدهکاریم (بدهی ما)</mat-radio-button></mat-radio-group>
      @if(form.controls.isDebit.touched && form.controls.isDebit.invalid){<p class="error">جهت مانده را انتخاب کنید.</p>}
      <mat-form-field appearance="outline"><mat-label>مبلغ مثبت (ریال)</mat-label><input matInput persianNumber="string" formControlName="amount"><mat-error>مبلغ باید مثبت و حداکثر دو رقم اعشار باشد.</mat-error></mat-form-field>
    }@else{
      <app-opening-entity-select label="انبار" [rows]="data.warehouses" [value]="form.controls.warehouseId.value" (valueChange)="form.controls.warehouseId.setValue($event)" [disabled]="!!row || saving || uncertain"></app-opening-entity-select>
      <app-opening-entity-select label="کالای انباری" [rows]="data.items" [value]="form.controls.itemId.value" (valueChange)="form.controls.itemId.setValue($event)" [disabled]="!!row || saving || uncertain"></app-opening-entity-select>
      <mat-form-field appearance="outline"><mat-label>تعداد موجود</mat-label><input matInput persianNumber="string" formControlName="quantity"><mat-error>تعداد باید مثبت و حداکثر سه رقم اعشار باشد.</mat-error></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>بهای خرید / تمام‌شده هر واحد (ریال)</mat-label><input matInput persianNumber="string" formControlName="unitCost"><mat-hint>اگر بها مشخص نیست، خالی بگذارید؛ صفر یعنی بهای مشخصِ صفر.</mat-hint><mat-error>بها باید نامنفی و حداکثر چهار رقم اعشار باشد.</mat-error></mat-form-field>
      <p aria-live="polite">{{total===null ? 'ارزش‌گذاری نیازمند تکمیل بها است.' : 'ارزش کل: '+money(total)+' ریال'}}</p>
      @if(row){<p>پس از ثبت گردش، تغییر تعداد و تاریخ و حذف مجاز نیست؛ تکمیل بها و توضیح با حفظ تعداد و تاریخ امکان‌پذیر است.</p>}
    }
    <app-persian-date-field label="تاریخ شروع" mode="date" formControlName="date"></app-persian-date-field>
    @if(form.controls.date.touched && form.controls.date.invalid){<p class="error">تاریخ معتبر و حداکثر امروز را انتخاب کنید.</p>}
    <mat-form-field appearance="outline"><mat-label>توضیح (اختیاری)</mat-label><textarea matInput formControlName="note" maxlength="500" rows="2"></textarea><mat-error>توضیح حداکثر ۵۰۰ نویسه است.</mat-error></mat-form-field>
  </mat-dialog-content><mat-dialog-actions align="end"><button type="button" mat-button [disabled]="saving" (click)="ref.close()">انصراف</button><button type="submit" mat-flat-button [disabled]="saving || form.invalid || conflict || uncertain">{{saving ? 'در حال بررسی / ذخیره…' : 'ذخیره'}}</button></mat-dialog-actions></form>
`,styles:[`.fields{display:flex;flex-direction:column;gap:16px;padding-top:8px}.error{color:var(--mat-sys-error);white-space:pre-line}mat-radio-group{display:flex;flex-direction:column;gap:8px}`]})
export class OpeningBalanceDialogComponent {
  readonly data=inject<OpeningDialogData>(MAT_DIALOG_DATA);readonly ref=inject(MatDialogRef<OpeningBalanceDialogComponent>);
  private service=inject(OpeningBalancesService);private fb=inject(FormBuilder);row=this.data.row;
  saving=false;error:string|null=null;conflict=false;uncertain=false;private pendingFilters:OpeningFilters={};readonly money=formatPersianNumber;
  form=this.fb.group({contactId:[this.row?.contactId ?? this.data.contactId],itemId:[this.row?.itemId ?? this.data.itemId],warehouseId:[this.row?.warehouseId ?? this.data.warehouseId],
    isDebit:[this.row?.isDebit ?? null],date:[this.row?.dateUtc.slice(0,10) ?? this.data.date,[Validators.required,openingDateValidator]],
    amount:[this.row?.amount ?? ''],quantity:[this.row?.quantity ?? ''],unitCost:[this.row?.unitCost ?? ''],note:[this.row?.note ?? '',Validators.maxLength(500)]});
  constructor(){
    if(this.data.kind==='contacts'){
      this.form.controls.contactId.addValidators([Validators.required,Validators.min(1)]);this.form.controls.isDebit.addValidators(Validators.required);
      this.form.controls.amount.addValidators(openingDecimalValidator(2,'9999999999999999.99'));
    }else{
      this.form.controls.itemId.addValidators([Validators.required,Validators.min(1)]);this.form.controls.warehouseId.addValidators([Validators.required,Validators.min(1)]);
      this.form.controls.quantity.addValidators(openingDecimalValidator(3,'999999999999999.999'));
      this.form.controls.unitCost.addValidators(openingDecimalValidator(4,'99999999999999.9999',true,true));
    }
    if(!this.row){
      if(this.data.kind==='contacts')this.form.controls.contactId.addValidators(control=>this.data.contacts.some(row=>row.id===control.value)?null:{selection:true});
      else{
        this.form.controls.itemId.addValidators(control=>this.data.items.some(row=>row.id===control.value && row.type===1)?null:{selection:true});
        this.form.controls.warehouseId.addValidators(control=>this.data.warehouses.some(row=>row.id===control.value)?null:{selection:true});
      }
    }
    for(const control of Object.values(this.form.controls))control.updateValueAndValidity();
  }
  get total(){const v=this.form.getRawValue();return openingTotal(v.quantity??'',v.unitCost??'');}
  private busy(value:boolean){this.saving=value;this.ref.disableClose=true;value?this.form.disable():this.form.enable();}
  private filters(){const v=this.form.getRawValue();return this.data.kind==='contacts'?{contactId:v.contactId}:{warehouseId:v.warehouseId,itemId:v.itemId};}
  save(){
    if(this.saving || this.conflict || this.uncertain)return;
    this.form.controls.date.updateValueAndValidity();if(this.form.invalid){this.form.markAllAsTouched();return;}
    const v=this.form.getRawValue();const common={dateUtc:openingDayToUtc(v.date!),note:v.note?.trim() || null,...(this.row?{rowVersionBase64:this.row.rowVersionBase64}:{})};
    const body:OpeningBody=this.data.kind==='contacts'?{...common,contactId:v.contactId!,amount:v.amount!,isDebit:v.isDebit!}:{...common,warehouseId:v.warehouseId!,itemId:v.itemId!,quantity:v.quantity!,unitCost:v.unitCost==='' || v.unitCost==null?null:v.unitCost};
    this.pendingFilters=this.filters();this.error=null;this.busy(true);
    this.service.save(this.data.kind,body,this.row?.id).subscribe({next:row=>this.ref.close(row),error:err=>{
      this.busy(false);this.error=openingError(err);
      if(err.status===409){this.conflict=true;this.data.onConflict();}
      if(!this.row && (err.status==null || err.status===0 || err.status>=500)){this.uncertain=true;this.error+='\nنتیجه ثبت مشخص نیست؛ پیش از ارسال دوباره، نتیجه ثبت قبلی را بررسی کنید.';}
    }});
  }
  verifyPrevious(){if(this.saving)return;this.busy(true);this.service.list(this.data.kind,this.pendingFilters).subscribe({next:rows=>{this.busy(false);if(rows.length){this.ref.close(rows[0]);return;}this.uncertain=false;this.error='رکوردی برای انتخاب فعلی پیدا نشد؛ می‌توانید ثبت را دوباره انجام دهید.';},error:err=>{this.busy(false);this.error=openingError(err);}});}
  reloadLatest(){if(this.saving)return;this.busy(true);this.service.list(this.data.kind,this.filters()).subscribe({next:rows=>{
    this.busy(false);const row=rows.find(r=>r.id===this.row?.id);if(!row){this.error='رکورد حذف شده یا در دسترس نیست؛ فرم را ببندید و فهرست را بررسی کنید.';return;}
    this.row=row;this.form.patchValue({date:row.dateUtc.slice(0,10),amount:row.amount??'',quantity:row.quantity??'',unitCost:row.unitCost??'',isDebit:row.isDebit,note:row.note??''});this.conflict=false;this.error='آخرین نسخه بارگذاری شد؛ مقادیر را پیش از ذخیره بررسی کنید.';
  },error:err=>{this.busy(false);this.error=openingError(err);}});}
}
