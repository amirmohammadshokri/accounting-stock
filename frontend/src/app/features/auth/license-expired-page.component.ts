import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { LicenseService } from '../../core/services/license.service';
import { AuthService } from '../../core/services/auth.service';

@Component({standalone:true,imports:[MatButtonModule,...APP_ICON_IMPORTS],
  template:`<section aria-labelledby="license-title"><mat-icon [svgIcon]="'lock_outline'"></mat-icon><h1 id="license-title">اعتبار نرم‌افزار پایان یافته است</h1><p>برای تمدید اعتبار با پشتیبانی تماس بگیرید.</p><p>اطلاعات شما محفوظ است و پس از تمدید می‌توانید کارتان را ادامه دهید.</p><button mat-flat-button type="button" (click)="check()" [disabled]="license.loading()"><mat-icon [svgIcon]="'refresh'"></mat-icon>{{license.loading() ? 'در حال بررسی…' : 'بررسی مجدد اعتبار'}}</button>@if(license.error()){<p role="alert">ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.</p>}@else if(checked() && license.isExpired()){<p role="status">اعتبار هنوز تمدید نشده است.</p>}</section>`,
  styles:[`:host{display:grid;place-items:center;min-height:75vh}section{max-width:540px;text-align:center;background:var(--mat-sys-surface-container-low);border:1px solid var(--mat-sys-outline-variant);border-radius:24px;padding:40px 24px}section>mat-icon{width:48px;height:48px;color:var(--mat-sys-primary)}h1{font-size:22px;line-height:1.8}p{line-height:2;color:var(--mat-sys-on-surface-variant)}button{margin-top:16px}`]
})
export class LicenseExpiredPageComponent {
  readonly license=inject(LicenseService);
  private readonly auth=inject(AuthService);
  private readonly router=inject(Router);
  private hasChecked=false;
  checked():boolean{return this.hasChecked;}
  check():void{this.hasChecked=true;this.license.reload(()=>{void this.router.navigateByUrl(this.auth.isAuthenticated()?'/dashboard':'/login');});}
}
