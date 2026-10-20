import { Component, Input, forwardRef, inject } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JALALI_DATE_FORMATS, JalaliDateAdapter, PersianDatepickerIntl } from './jalali-date-adapter';

@Component({
  selector: 'app-persian-date-field', standalone: true,
  host: {'[class.with-time]': "mode === 'datetime'"},
  imports: [ReactiveFormsModule, MatDatepickerModule, MatTimepickerModule, MatFormFieldModule, MatInputModule, MatButtonModule, ...APP_ICON_IMPORTS],
  providers: [
    { provide: DateAdapter, useClass: JalaliDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: JALALI_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'fa-IR' },
    { provide: MatDatepickerIntl, useClass: PersianDatepickerIntl },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PersianDateFieldComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PersianDateFieldComponent), multi: true }
  ],
  template: `
    <div class="date-fields">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ label }}</mat-label>
        <input matInput [formControl]="dateControl" [matDatepicker]="calendar" [readonly]="readonly" [min]="minDate" [max]="maxDate" placeholder="۱۴۰۵/۰۱/۰۱" dir="ltr" (click)="!readonly && calendar.open()" (blur)="touch()">
        <mat-datepicker-toggle matIconSuffix [for]="calendar" [disabled]="disabled || readonly" [aria-label]="'انتخاب ' + label"></mat-datepicker-toggle>
        <mat-datepicker #calendar (closed)="touch()">
          <mat-datepicker-actions>
            <button mat-button type="button" (click)="selectToday(); calendar.close()">امروز</button>
            <button mat-button matDatepickerCancel type="button">انصراف</button>
            <button mat-flat-button matDatepickerApply type="button">انتخاب</button>
          </mat-datepicker-actions>
        </mat-datepicker>
        @if (dateControl.invalid) { <mat-error>تاریخ شمسی معتبر انتخاب کنید.</mat-error> }
      </mat-form-field>
      @if (mode === 'datetime') {
        <mat-form-field appearance="outline" class="time-field" subscriptSizing="dynamic">
          <mat-label>ساعت</mat-label>
          <input matInput [formControl]="timeControl" [matTimepicker]="clock" [matTimepickerOpenOnClick]="!readonly" [readonly]="readonly" dir="ltr" placeholder="۱۲:۳۰" (blur)="touch()">
          <mat-timepicker-toggle matIconSuffix [for]="clock" [disabled]="disabled || readonly" aria-label="انتخاب ساعت"></mat-timepicker-toggle>
          <mat-timepicker #clock interval="15m" aria-label="انتخاب ساعت"></mat-timepicker>
          @if (timeControl.invalid) { <mat-error>ساعت معتبر انتخاب کنید.</mat-error> }
        </mat-form-field>
      }
    </div>
  `,
  styles: [`:host { display:block;min-width:0;width:192px;max-width:100%;justify-self:start;flex:0 0 auto; } :host(.with-time){width:340px} .date-fields{display:flex;flex-wrap:wrap;gap:12px}mat-form-field{flex:0 0 192px;max-width:100%;min-width:0}.time-field{flex-basis:136px} input { text-align: right; }`]
})
export class PersianDateFieldComponent implements ControlValueAccessor, Validator {
  @Input() label = 'تاریخ';
  @Input() mode: 'date' | 'datetime' = 'date';
  @Input() readonly = false;
  disabled = false;
  readonly dateControl = new FormControl<Date | null>(null);
  readonly timeControl = new FormControl<Date | null>(null);
  private adapter = inject(DateAdapter<Date>);
  readonly minDate = this.adapter.createDate(1200, 0, 1);
  readonly maxDate = this.adapter.createDate(1600, 11, 29);
  private change: (value: string) => void = () => {};
  private touched = () => {};
  private validatorChange = () => {};

  constructor() {
    this.dateControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.emit());
    this.timeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.emit());
  }
  writeValue(value: string | null) {
    const date = this.adapter.deserialize(value);
    const valid = date && this.adapter.isValid(date) ? date : null;
    this.dateControl.setValue(valid, { emitEvent: false });
    this.timeControl.setValue(valid, { emitEvent: false });
  }
  registerOnChange(fn: (value: string) => void) { this.change = fn; }
  registerOnTouched(fn: () => void) { this.touched = fn; }
  registerOnValidatorChange(fn: () => void) { this.validatorChange = fn; }
  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
    for (const control of [this.dateControl, this.timeControl]) disabled ? control.disable({ emitEvent: false }) : control.enable({ emitEvent: false });
  }
  validate(_: AbstractControl): ValidationErrors | null {
    return this.dateControl.invalid || (this.mode === 'datetime' && (this.timeControl.invalid || (!!this.dateControl.value && !this.timeControl.value))) ? { persianDate: true } : null;
  }
  touch() { this.touched(); }
  selectToday() { this.dateControl.setValue(this.adapter.today()); this.touch(); }
  private emit() {
    if (this.readonly || this.disabled) return;
    const date = this.dateControl.value;
    if (this.mode === 'datetime' && date && !this.timeControl.value && this.timeControl.valid) this.timeControl.setValue(this.adapter.setTime(date, 0, 0, 0), { emitEvent: false });
    if (!date || this.validate({} as AbstractControl)) this.change('');
    else {
      const day = this.adapter.toIso8601(date);
      const time = this.timeControl.value;
      this.change(this.mode === 'datetime' && time ? `${day}T${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}` : day);
    }
    this.validatorChange();
  }
}
