/**
 * Login Page
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { APP_BRAND } from '../../core/app-brand';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ...APP_ICON_IMPORTS,
    MatSnackBarModule
  ],
  template: `
    <main class="login-page" dir="rtl">
      <section class="login-story" aria-label="سامانه مدیریت کترینگ">
        <div class="brand"><mat-icon [svgIcon]="'restaurant'"></mat-icon><span>{{brand.cateringName}}</span></div>
        <div><span class="eyebrow">مدیریت سادهٔ کترینگ</span><h1>سفارش‌ها مرتب،<br>حساب‌ها روشن.</h1><p>از انتخاب پکیج غذا تا ثبت پرداخت و چاپ فاکتور؛ کارهای روزانه را یکجا انجام دهید.</p></div>
        <div class="story-features"><span><mat-icon [svgIcon]="'lunch_dining'"></mat-icon>سفارش و پکیج غذا</span><span><mat-icon [svgIcon]="'payments'"></mat-icon>حساب مشتری‌ها</span><span><mat-icon [svgIcon]="'print'"></mat-icon>چاپ فاکتور</span></div>
      </section>
      <section class="login-form-area">
        <div class="login-card"><div class="welcome-icon"><mat-icon [svgIcon]="'login'"></mat-icon></div><h2>خوش آمدید</h2><p class="subtitle">برای شروع، وارد حساب خود شوید.</p>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline"><mat-label>ایمیل حساب</mat-label><input matInput type="email" formControlName="email" autocomplete="username" placeholder="name@example.com" (input)="errorMessage.set(null)"><mat-icon matPrefix [svgIcon]="'alternate_email'"></mat-icon>
              <mat-error>{{form.controls.email.hasError('required') ? 'ایمیل خود را وارد کنید.' : 'ایمیل را به شکل name@example.com وارد کنید.'}}</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>رمز عبور</mat-label><input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" autocomplete="current-password" (input)="errorMessage.set(null)" (keyup)="checkCaps($event)">
              <mat-icon matPrefix [svgIcon]="'lock_outline'"></mat-icon><button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="hidePassword() ? 'نمایش رمز عبور' : 'پنهان کردن رمز عبور'"><mat-icon [svgIcon]="hidePassword() ? 'visibility' : 'visibility_off'"></mat-icon></button><mat-error>رمز عبور خود را وارد کنید.</mat-error>
            </mat-form-field>
            @if(capsLock()){<p class="caps-hint">کلید Caps Lock روشن است.</p>}
            @if(errorMessage()){<div class="login-error" role="alert"><mat-icon [svgIcon]="'error_outline'"></mat-icon><span>{{errorMessage()}}</span></div>}
            <button mat-flat-button type="submit" class="submit-btn" [disabled]="loading()">@if(loading()){<mat-spinner diameter="20"></mat-spinner><span>در حال ورود…</span>}@else{<span>ورود به سامانه</span>}<mat-icon *ngIf="!loading()" iconPositionEnd [svgIcon]="'arrow_back'"></mat-icon></button>
          </form><p class="help">اگر رمز را فراموش کرده‌اید، از مدیر سامانه کمک بگیرید.</p>
        </div><p class="login-footer">ساده، منظم و مناسب کارهای روزمره</p>
      </section>
    </main>
  `,
  styles:[`
    :host{display:block;min-height:100dvh}.login-page{min-height:100dvh;display:grid;grid-template-columns:1.05fr 1fr;background:#eef3f5;color:#203e3a}.login-story{padding:clamp(32px,6vw,88px);display:flex;flex-direction:column;justify-content:space-between;gap:48px;overflow:hidden;background:radial-gradient(circle at 10% 80%,#2b7264 0,transparent 48%),linear-gradient(140deg,#103f38,#1b594c);color:#fff}.brand{display:flex;align-items:center;gap:12px;font-size:16px}.brand mat-icon{background:#ffffff18;border-radius:16px;padding:12px;box-sizing:content-box}.eyebrow{color:#b9e3d2;font-size:14px}h1{font-size:clamp(32px,4vw,54px);font-weight:800;line-height:1.65;margin:16px 0}p{line-height:2}.login-story p{color:#d0e6df;font-size:16px;max-width:420px}.story-features{display:flex;flex-wrap:wrap;gap:16px}.story-features span{display:flex;align-items:center;gap:7px;font-size:12px;color:#d7eae2}.story-features mat-icon{font-size:20px;width:20px;height:20px}.login-form-area{display:flex;flex-direction:column;justify-content:center;align-items:center;padding:32px 24px}.login-card{width:100%;max-width:420px;background:#fff;border:1px solid #dbe6e2;border-radius:28px;padding:clamp(24px,4vw,40px);box-shadow:0 16px 60px #193d3610}.welcome-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:16px;background:#e3f1eb;color:#1d6e55}h2{font-size:28px;margin:20px 0 4px}.subtitle{color:#6a7d77;font-size:14px;margin:0 0 28px}form{display:flex;flex-direction:column;gap:12px}mat-form-field{width:100%}.submit-btn{width:100%;height:50px!important;border-radius:14px;font-size:16px;background:#18654e!important;color:#fff!important}.submit-btn mat-spinner{display:inline-block;margin-inline-end:12px;--mdc-circular-progress-active-indicator-color:white}.help,.login-footer{font-size:12px;color:#6a7d77}.help{margin-top:24px;text-align:center}.login-footer{margin:20px 0 0}.login-error{display:flex;align-items:flex-start;gap:8px;background:#fff0ee;color:#a82a23;border:1px solid #f4c6c0;border-radius:12px;padding:12px;font-size:13px;line-height:1.8}.login-error mat-icon{flex-shrink:0}.caps-hint{color:#9a6500;font-size:12px;margin:0}
    @media(max-width:800px){.login-page{grid-template-columns:1fr}.login-story{padding:24px;gap:20px}.brand{font-size:14px}h1{font-size:28px;margin:8px 0}h1 br{display:none}.login-story p,.story-features{display:none}.login-form-area{padding:24px 16px}.login-card{max-width:460px}}
  `]
})
export class LoginPageComponent {
  readonly brand = APP_BRAND;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  hidePassword = signal(true);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  errorMessage = signal<string | null>(null);
  capsLock = signal(false);
  checkCaps(event: KeyboardEvent): void { this.capsLock.set(event.getModifierState('CapsLock')); }
  onSubmit(): void {
    if (this.loading()) return;
    this.form.controls.email.setValue((this.form.controls.email.value ?? '').trim());
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.errorMessage.set(null);

    this.loading.set(true);

    const { email, password } = this.form.value;

    this.authService.login({
      email: email!,
      password: password!
    }).subscribe({
      next: () => {
        this.snackBar.open('ورود موفق بود!', 'بستن', { duration: 3000 });
        this.router.navigate(['/']);
      },
      error: (error: {status?:number;error?:{detail?:string}}) => {
        this.loading.set(false);
        this.errorMessage.set(error.status === 0 ? 'ارتباط با سامانه برقرار نشد. اتصال را بررسی و دوباره تلاش کنید.'
          : error.status === 429 ? 'درخواست‌های ورود زیاد است؛ کمی صبر کنید و دوباره امتحان کنید.'
          : error.status && error.status >= 500 ? 'سامانه موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.'
          : error.error?.detail || 'ایمیل یا رمز عبور درست نیست. دوباره بررسی کنید.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}
