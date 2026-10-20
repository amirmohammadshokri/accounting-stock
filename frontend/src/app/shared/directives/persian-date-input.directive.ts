import { Directive, ElementRef, forwardRef, HostListener, inject, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { isoToJalaliInput, jalaliInputToIso } from '../../core/utils/persian.utils';

@Directive({
  selector: 'input[persianDate]',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PersianDateInputDirective), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PersianDateInputDirective), multi: true }
  ],
  host: { 'dir': 'ltr', 'inputmode': 'text' }
})
export class PersianDateInputDirective implements ControlValueAccessor, Validator, OnInit {
  private input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private withTime = false;
  private invalid = false;
  private change: (value: string) => void = () => {};
  private touched: () => void = () => {};
  private validatorChange = () => {};

  ngOnInit() {
    this.withTime = this.input.getAttribute('persianDate') === 'datetime';
    this.input.placeholder = this.withTime ? '۱۴۰۵/۰۱/۰۱ ۱۲:۳۰' : '۱۴۰۵/۰۱/۰۱';
    this.input.title = this.withTime ? 'تاریخ شمسی و ساعت؛ مثال: ۱۴۰۵/۰۱/۰۱ ۱۲:۳۰' : 'تاریخ شمسی؛ مثال: ۱۴۰۵/۰۱/۰۱';
  }
  writeValue(value: string | null) {
    this.withTime = this.input.getAttribute('persianDate') === 'datetime';
    this.input.value = isoToJalaliInput(value ?? '', this.withTime);
    this.invalid = false;
    this.input.setCustomValidity('');
  }
  registerOnChange(fn: (value: string) => void) { this.change = fn; }
  registerOnTouched(fn: () => void) { this.touched = fn; }
  registerOnValidatorChange(fn: () => void) { this.validatorChange = fn; }
  setDisabledState(disabled: boolean) { this.input.disabled = disabled; }
  validate(_: AbstractControl): ValidationErrors | null { return this.invalid ? { persianDate: true } : null; }

  @HostListener('input') onInput() {
    const text = this.input.value.trim();
    const iso = text ? jalaliInputToIso(text, this.withTime) : '';
    this.invalid = iso === null;
    this.input.setCustomValidity(this.invalid ? 'تاریخ شمسی معتبر وارد کنید.' : '');
    this.change(iso ?? '');
    this.validatorChange();
  }
  @HostListener('blur') onBlur() { this.touched(); }
}
