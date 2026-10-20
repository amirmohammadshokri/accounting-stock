import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { AppearanceService } from '../../core/services/appearance.service';

@Component({
  standalone: true, selector: 'app-appearance-page',
  imports: [FormsModule, MatCardModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, ...APP_ICON_IMPORTS],
  template: `
    <header class="page-heading"><div><h1>تنظیمات ظاهر</h1><p>رنگ دکمه‌ها و پس‌زمینه را جداگانه و مطابق سلیقه خود تنظیم کنید.</p></div></header>
    <mat-card appearance="outlined" class="settings-card">
      <mat-card-header><mat-card-title>تم برنامه</mat-card-title><mat-card-subtitle>انتخاب شما در این مرورگر برای حساب خودتان ذخیره می‌شود.</mat-card-subtitle></mat-card-header>
      <mat-card-content>
        <mat-button-toggle-group aria-label="تم برنامه" [value]="appearance.preferences().mode" (change)="appearance.setMode($event.value)">
          <mat-button-toggle value="light"><mat-icon [svgIcon]="'light_mode'"></mat-icon> روشن</mat-button-toggle>
          <mat-button-toggle value="dark"><mat-icon [svgIcon]="'dark_mode'"></mat-icon> تیره</mat-button-toggle>
          <mat-button-toggle value="system"><mat-icon [svgIcon]="'brightness_auto'"></mat-icon> مطابق سیستم</mat-button-toggle>
        </mat-button-toggle-group>
        <h2>رنگ اصلی</h2>
        <div class="presets">
          @for (preset of appearance.presets; track preset.color) {
            <button mat-stroked-button [class.selected]="appearance.preferences().color === preset.color" (click)="appearance.setColor(preset.color)" [attr.aria-pressed]="appearance.preferences().color === preset.color">
              <span class="swatch" [style.background]="preset.color"></span>{{ preset.name }}
            </button>
          }
        </div>
        <div class="custom-color">
          <label for="custom-color">انتخاب رنگ دلخواه</label>
          <input id="custom-color" type="color" aria-label="انتخاب رنگ دلخواه" [ngModel]="appearance.preferences().color" (ngModelChange)="appearance.setColor($event)">
          <mat-form-field appearance="outline"><mat-label>کد رنگ</mat-label><input matInput dir="ltr" [ngModel]="appearance.preferences().color" (ngModelChange)="appearance.setColor($event)" pattern="#[0-9a-fA-F]{6}" maxlength="7"><mat-hint>مانند #00796b</mat-hint></mat-form-field>
        </div>
        <section class="background-settings" aria-labelledby="background-title">
          <h2 id="background-title">رنگ پس‌زمینه فضای کار</h2><p class="background-hint">رنگ انتخابی با تم ترکیب می‌شود تا فرم‌ها و نوشته‌ها خوانا بمانند. تغییرات همان لحظه اعمال می‌شوند.</p>
          <div class="presets">@for(preset of appearance.backgroundPresets;track preset.color){
            <button mat-stroked-button [class.selected]="appearance.preferences().backgroundColor===preset.color" (click)="appearance.setBackgroundColor(preset.color)" [attr.aria-pressed]="appearance.preferences().backgroundColor===preset.color"><span class="swatch" [style.background]="preset.color"></span>{{preset.name}}</button>
          }</div>
          <div class="custom-color"><label for="background-color">رنگ پس‌زمینه دلخواه</label><input id="background-color" type="color" aria-label="انتخاب رنگ پس‌زمینه" [ngModel]="appearance.preferences().backgroundColor" (ngModelChange)="appearance.setBackgroundColor($event)">
            <mat-form-field appearance="outline"><mat-label>کد رنگ پس‌زمینه</mat-label><input matInput dir="ltr" [ngModel]="appearance.preferences().backgroundColor" (ngModelChange)="appearance.setBackgroundColor($event)" pattern="#[0-9a-fA-F]{6}" maxlength="7"><mat-hint>مانند #cfe5de</mat-hint></mat-form-field>
          </div>
          <mat-button-toggle-group aria-label="طرح پس‌زمینه" [value]="appearance.preferences().backgroundStyle" (change)="appearance.setBackgroundStyle($event.value)"><mat-button-toggle value="soft">طیف ملایم</mat-button-toggle><mat-button-toggle value="solid">رنگ یکدست</mat-button-toggle></mat-button-toggle-group>
          <div class="background-preview"><div class="sample-card"><mat-icon [svgIcon]="'dashboard_customize'"></mat-icon><strong>فضای کار شما</strong><span>کارت‌ها خوانا، پس‌زمینه به رنگ دلخواه</span></div></div>
          <button mat-button (click)="appearance.resetBackground()">بازگشت به پس‌زمینه پیش‌فرض</button>
        </section>
        <mat-card appearance="outlined" class="preview"><mat-card-content><mat-icon [svgIcon]="'palette'"></mat-icon><div><strong>پیش‌نمایش تم انتخاب‌شده</strong><p>دکمه‌ها، فرم‌ها، داشبورد و جدول‌ها از همین تم استفاده می‌کنند.</p></div><button mat-flat-button>دکمهٔ نمونه</button></mat-card-content></mat-card>
      </mat-card-content>
      <mat-card-actions align="end"><button mat-button (click)="appearance.reset()">بازگشت به ظاهر پیش‌فرض</button></mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .background-settings{border-top:1px solid var(--mat-sys-outline-variant);margin-top:28px;padding-top:4px}.background-hint{font-size:12px;color:var(--mat-sys-on-surface-variant);line-height:1.9}.background-preview{padding:28px;margin-top:20px;border:1px solid var(--mat-sys-outline-variant);border-radius:18px;background-color:var(--app-workspace);background-image:var(--app-workspace-image)}.sample-card{display:flex;align-items:center;flex-wrap:wrap;gap:12px;border-radius:14px;padding:20px;background:var(--mat-sys-surface-container-lowest);color:var(--mat-sys-on-surface);box-shadow:0 6px 18px #183b3210}.sample-card span{font-size:12px}.sample-card mat-icon{color:var(--mat-sys-primary)}
    .settings-card { max-width: 900px; }
    mat-card-content { padding-top: 24px; }
    h2 { margin-top: 28px; font: var(--mat-sys-title-medium); }
    .presets, .custom-color { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
    .swatch { display: inline-block; width: 18px; height: 18px; border-radius: 50%; margin-inline-end: 8px; vertical-align: middle; }
    .selected { background: var(--mat-sys-primary-container); }
    .custom-color { margin-block: 24px; }
    input[type=color] { width: 56px; height: 44px; border: 1px solid var(--mat-sys-outline-variant); border-radius: 8px; cursor: pointer; background: var(--mat-sys-surface); }
    .preview { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .preview mat-card-content { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 20px; }
    .preview p { margin-bottom: 0; }
    @media (max-width: 600px) { mat-button-toggle-group { display: flex; flex-wrap: wrap; } }
  `]
})
export class AppearancePageComponent { appearance = inject(AppearanceService); }
