import { LogoUploadComponent } from '../../shared/logo-upload/logo-upload.component';
import { latinDigits } from '../../core/utils/persian.utils';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanySettingsService } from '../../core/services/company-settings.service';
import { CompanySettingsDto } from '../../core/models/company-settings.models';
import { PermissionService } from '../../core/services/permission.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  standalone: true,
  selector: 'app-company-settings-page',
  imports: [LogoUploadComponent,
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatCardModule, ...APP_ICON_IMPORTS, HasPermissionDirective
  ],
  template: `
    <div class="error-state" *ngIf="error">
      <mat-icon [svgIcon]="'error_outline'"></mat-icon>
      <span>{{ error }}</span>
      <button mat-button (click)="load()">تلاش دوباره</button>
    </div>
    <mat-card class="settings-card" *ngIf="loaded">
      <mat-card-header>
        <mat-card-title>تنظیمات شرکت</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>شناسه ملی / کد ملی</mat-label><input matInput formControlName="nationalId" inputmode="numeric" (input)="form.controls.nationalId.setValue(latinDigits($any($event.target).value))" maxlength="11" /><mat-hint>۱۰ رقم برای شخص، ۱۱ رقم برای شرکت</mat-hint><mat-error>شناسه ملی / کد ملی باید ۱۰ یا ۱۱ رقم باشد.</mat-error></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>کدپستی</mat-label><input matInput formControlName="postalCode" inputmode="numeric" (input)="form.controls.postalCode.setValue(latinDigits($any($event.target).value))" maxlength="10" /><mat-error>کدپستی باید ۱۰ رقم باشد.</mat-error></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام شرکت</mat-label>
              <input matInput formControlName="title" maxlength="200" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>شماره اقتصادی</mat-label>
              <input matInput formControlName="taxNumber" maxlength="20" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>حوزه مالیاتی</mat-label>
              <input matInput formControlName="taxOffice" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>تلفن</mat-label>
              <input matInput formControlName="phone" maxlength="20" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>ایمیل</mat-label>
              <input matInput formControlName="email" type="email" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>وب‌سایت</mat-label>
              <input matInput formControlName="website" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>شماره ثبت تجاری</mat-label>
              <input matInput formControlName="tradeRegisterNo" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>شناسه ثبت قبلی</mat-label>
              <input matInput formControlName="mersisNo" />
            </mat-form-field>
            <app-logo-upload formControlName="logoUrl"></app-logo-upload>
            <mat-form-field appearance="outline" class="full">
              <mat-label>نشانی</mat-label>
              <textarea matInput formControlName="address" rows="2"></textarea>
            </mat-form-field>
          </div>
          <div class="actions" *appHasPermission="'CompanySettings.Update'">
            <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid || saving">ذخیره</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .settings-card { max-width: 900px; margin: 16px 0; }
    .grid { display:grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 8px 16px; }
    .grid .full { grid-column: 1 / -1; }
    .grid app-logo-upload {grid-column:1 / -1;}
    .actions { display:flex; justify-content:flex-end; padding-top: 8px; }
    .error-state {
      display:flex; align-items:center; gap:10px;
      padding: 16px; border-radius: 8px; max-width: 600px; margin: 16px 0;
      background: var(--mat-sys-error-container); color: var(--mat-sys-error);
    }
    .error-state span { flex:1; }
  `]
})
export class CompanySettingsPageComponent implements OnInit {
  private service = inject(CompanySettingsService);
  readonly latinDigits = latinDigits;
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private permissionService = inject(PermissionService);

  loaded = false;
  saving = false;
  error: string | null = null;
  private current!: CompanySettingsDto;

  form = this.fb.group({
    nationalId: ['', [Validators.pattern(/^[0-9]{10,11}$/)]],
    postalCode: ['', [Validators.pattern(/^[0-9]{10}$/)]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    taxNumber: ['', [Validators.required, Validators.maxLength(20)]],
    taxOffice: [''],
    address: [''],
    phone: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email]],
    website: [''],
    tradeRegisterNo: [''],
    mersisNo: [''],
    logoUrl: ['']
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.error = null;
    this.service.get().subscribe({
      next: dto => {
        this.current = dto;
        this.form.patchValue({
          nationalId: dto.nationalId ?? '',
          postalCode: dto.postalCode ?? '',
          title: dto.title,
          taxNumber: dto.taxNumber ?? '',
          taxOffice: dto.taxOffice ?? '',
          address: dto.address ?? '',
          phone: dto.phone ?? '',
          email: dto.email ?? '',
          website: dto.website ?? '',
          tradeRegisterNo: dto.tradeRegisterNo ?? '',
          mersisNo: dto.mersisNo ?? '',
          logoUrl: dto.logoUrl ?? ''
        });
        this.loaded = true;
        if (!this.permissionService.has('CompanySettings.Update')) {
          this.form.disable();
        }
      },
      error: () => {
        this.loaded = false;
        this.error = 'بارگذاری تنظیمات شرکت ناموفق بود.';
      }
    });
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving = true;
    this.service.update({
      id: this.current.id,
      rowVersionBase64: this.current.rowVersionBase64,
      nationalId: v.nationalId || null,
      postalCode: v.postalCode || null,
      title: v.title!,
      taxNumber: v.taxNumber || null,
      taxOffice: v.taxOffice || null,
      address: v.address || null,
      phone: v.phone || null,
      email: v.email || null,
      website: v.website || null,
      tradeRegisterNo: v.tradeRegisterNo || null,
      mersisNo: v.mersisNo || null,
      logoUrl: v.logoUrl || null
    }).subscribe({
      next: (updated) => {
        this.current = updated;
        this.saving = false;
        this.snack.open('تنظیمات شرکت به‌روزرسانی شد.', 'بستن', { duration: 2000 });
      },
      error: () => { this.saving = false; }
    });
  }
}
