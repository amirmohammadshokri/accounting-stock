import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { formatPersianNumber, latinDigits, persianDigits } from '../../core/utils/persian.utils';

@Directive({
  selector: 'input[persianNumber]', standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PersianNumberInputDirective), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PersianNumberInputDirective), multi: true }
  ],
  host: { dir: 'ltr', inputmode: 'decimal' }
})
export class PersianNumberInputDirective implements ControlValueAccessor, Validator {
  private input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private invalid = false;
  private change: (value: string | number | null) => void = () => {};
  private touched: () => void = () => {};
  private validatorChange = () => {};
  writeValue(value: string | number | null) { this.input.value = value == null ? '' : formatPersianNumber(value); this.invalid = false; }
  registerOnChange(fn: (value: string | number | null) => void) { this.change = fn; }
  registerOnTouched(fn: () => void) { this.touched = fn; }
  registerOnValidatorChange(fn: () => void) { this.validatorChange = fn; }
  setDisabledState(disabled: boolean) { this.input.disabled = disabled; }
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.invalid) return { persianNumber: true };
    if (control.value == null || control.value === '') return null;
    const min = this.input.getAttribute('min'), max = this.input.getAttribute('max');
    if (min != null && Number(control.value) < Number(min)) return { min: { min: Number(min), actual: control.value } };
    if (max != null && Number(control.value) > Number(max)) return { max: { max: Number(max), actual: control.value } };
    return null;
  }
  @HostListener('input') onInput() {
    const value = latinDigits(this.input.value).replace(',', '.').trim();
    this.invalid = value !== '' && !/^-?\d+(\.\d+)?$/.test(value);
    const numeric = this.input.getAttribute('persianNumber') === 'number';
    this.change(this.invalid || value === '' ? (numeric ? null : '') : numeric ? Number(value) : value);
    this.validatorChange();
  }
  @HostListener('blur') onBlur() {
    if (!this.invalid) this.input.value = formatPersianNumber(latinDigits(this.input.value).replace(',', '.').trim());
    this.touched();
  }
  @HostListener('focus') onFocus() {
    this.input.value = persianDigits(latinDigits(this.input.value)).replace('.', '٫');
  }
}
