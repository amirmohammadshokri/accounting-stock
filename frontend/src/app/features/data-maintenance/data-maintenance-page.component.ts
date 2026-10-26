import { PermissionService } from '../../core/services/permission.service';
import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { environment } from '../../../environments/environment';
import { HANDLE_ERROR_LOCALLY } from '../../core/interceptors/http-problem-interceptor';
import { persianError } from '../../core/utils/persian-errors';
import { persianDigits } from '../../core/utils/persian.utils';
import { finalize } from 'rxjs';

interface DataCount {key:string;label:string;count:number;}
interface ResetResult {completedAtUtc:string;deletedRecords:number;}
const normalize=(value:string)=>value.replace(/[\s\u200c]+/g,' ').trim();

@Component({standalone:true,imports:[ReactiveFormsModule,MatButtonModule,MatFormFieldModule,MatInputModule,MatCheckboxModule,...APP_ICON_IMPORTS],
  template:`
    <header class="page-heading"><div><h1>مدیریت داده‌ها</h1><p>آماده‌سازی نرم‌افزار برای شروع دوباره</p></div><button mat-stroked-button type="button" (click)="load()" [disabled]="busy() || loading()"><mat-icon [svgIcon]="'refresh'"></mat-icon>بازخوانی آمار</button></header>
    <section class="preserved"><h2>چه اطلاعاتی حفظ می‌شود؟</h2><p>کاربران، رمزهای عبور، نقش‌ها و دسترسی‌ها، شعبه‌ها و لوگوها، تعریف انبارها، واحدها، تنظیمات مجموعه و چاپ، تاریخ اعتبار نرم‌افزار و سوابق نظارتی حفظ می‌شوند.</p></section>
    <section class="records" aria-labelledby="records-title"><h2 id="records-title">اطلاعاتی که پاک می‌شود</h2><p>اطلاعات همه شعب، ردیف‌های وابسته و اطلاعات حذف‌شده قبلی هم پاک می‌شوند.</p>@if(loading()){<p role="status">در حال دریافت آمار…</p>}<div class="counts">@for(item of counts();track item.key){<div><span>{{item.label}}</span><strong>{{digits(item.count)}}</strong></div>}</div></section>
    @if(message()){<p class="success" role="status">{{message()}}</p>}
    @if(error()){<p class="form-error" role="alert">{{error()}}</p>}
    @if(permissions.has('DataMaintenance.Reset')){<section class="reset-panel"><h2><mat-icon [svgIcon]="'report_problem'"></mat-icon>پاک‌سازی اطلاعات عملیاتی</h2><p>این کار برگشت‌پذیر نیست. فقط زمانی ادامه دهید که می‌خواهید فاکتورها، سفارش‌ها، مشتری‌ها، کالاها و اطلاعات مالی و انبار حذف شوند.</p>
      <form [formGroup]="form" (ngSubmit)="reset()">
        <mat-form-field appearance="outline"><mat-label>رمز حساب مدیر</mat-label><input matInput type="password" formControlName="password" autocomplete="current-password" maxlength="256"><mat-error>رمز حساب خودتان را وارد کنید.</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>عبارت تأیید</mat-label><input matInput formControlName="confirmation" autocomplete="off" placeholder="پاک‌سازی اطلاعات" maxlength="64"><mat-hint>عبارت «پاک‌سازی اطلاعات» را بنویسید.</mat-hint><mat-error>عبارت «پاک‌سازی اطلاعات» را بنویسید.</mat-error></mat-form-field>
        <mat-checkbox formControlName="acknowledge">می‌دانم اطلاعات عملیاتی همه شعب برای همیشه حذف می‌شود.</mat-checkbox>
        <div class="actions"><button mat-flat-button type="submit" class="reset-button" [disabled]="!canReset()"><mat-icon [svgIcon]="'delete'"></mat-icon>{{busy() ? 'در حال پاک‌سازی؛ لطفاً صبر کنید…' : 'پاک‌سازی اطلاعات عملیاتی'}}</button></div>
      </form>
    </section>}`,styleUrl:'./data-maintenance-page.component.scss'})
export class DataMaintenancePageComponent {
  readonly permissions=inject(PermissionService);
  private readonly http=inject(HttpClient);
  private readonly fb=inject(FormBuilder);
  private readonly base=`${environment.apiBaseUrl}/data-maintenance`;
  readonly counts=signal<DataCount[]>([]);
  readonly loading=signal(false);
  readonly busy=signal(false);
  readonly error=signal('');
  readonly message=signal('');
  readonly previewReady=signal(false);
  readonly digits=persianDigits;
  readonly form=this.fb.nonNullable.group({password:['',[Validators.required,Validators.maxLength(256)]],confirmation:['',[Validators.required,Validators.maxLength(64),(control:AbstractControl)=>normalize(control.value ?? '')==='پاک سازی اطلاعات'?null:{confirmation:true}]],acknowledge:[false,Validators.requiredTrue]});
  constructor(){this.load();}
  canReset():boolean{return this.permissions.has('DataMaintenance.Reset') && this.previewReady() && !this.loading() && !this.busy() && this.form.valid;}
  load(clearError=true):void {
    if(this.loading() || this.busy())return;
    this.loading.set(true);if(clearError)this.error.set('');this.previewReady.set(false);
    this.http.get<DataCount[]>(this.base,{context:new HttpContext().set(HANDLE_ERROR_LOCALLY,true)})
      .pipe(finalize(()=>this.loading.set(false))).subscribe({next:items=>{this.counts.set(items);this.previewReady.set(true);},error:err=>this.error.set(this.errorText(err))});
  }
  reset():void {
    if(!this.canReset()){this.form.markAllAsTouched();return;}
    this.busy.set(true);this.error.set('');this.message.set('');
    const body=this.form.getRawValue();this.form.disable();
    this.http.post<ResetResult>(`${this.base}/reset`,body,{context:new HttpContext().set(HANDLE_ERROR_LOCALLY,true)})
      .pipe(finalize(()=>{this.busy.set(false);this.form.reset({password:'',confirmation:'',acknowledge:false});this.form.enable();this.load(false);}))
      .subscribe({next:()=>this.message.set('اطلاعات عملیاتی پاک شد. اکنون می‌توانید اطلاعات جدید را ثبت کنید.'),error:err=>this.error.set(this.errorText(err))});
  }
  private errorText(error:HttpErrorResponse):string {
    return error.status===0 ? 'پاسخ سرور دریافت نشد؛ برای اطمینان از وضعیت، آمار را بازخوانی کنید.' : persianError(error.error?.detail ?? error.error?.message,error.status);
  }
}
