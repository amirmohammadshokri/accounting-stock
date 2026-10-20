import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PersianDateInputDirective } from './persian-date-input.directive';
import { PersianNumberInputDirective } from './persian-number-input.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PersianDateInputDirective, PersianNumberInputDirective],
  template: `<form [formGroup]="form">
    <input id="date" persianDate="datetime" formControlName="date">
    <input id="money" persianNumber="string" formControlName="money">
    <input id="rate" persianNumber="number" min="0" max="100" formControlName="rate">
  </form>`
})
class InputHost {
  form = new FormGroup({ date: new FormControl('2026-10-14T13:45'), money: new FormControl('12345.67'), rate: new FormControl(20) });
}

describe('Persian form inputs', () => {
  it('shows Jalali dates but emits ISO strings and rejects impossible dates', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#date');
    expect(input.value).toBe('۱۴۰۵/۰۷/۲۲ ۱۳:۴۵');
    input.value = '۱۴۰۳/۱۲/۳۰ ۰۹:۱۵'; input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.form.controls.date.value).toBe('2025-03-20T09:15');
    input.value = '۱۴۰۴/۱۲/۳۰'; input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.form.controls.date.hasError('persianDate')).toBeTrue();
    expect(input.checkValidity()).toBeFalse();
  });
  it('preserves decimal strings and validates numeric range with Persian input', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#money');
    expect(input.value).toBe('۱۲٬۳۴۵٫۶۷');
    input.value = '۱۲۳٬۴۵۶٫۷۸'; input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.form.controls.money.value).toBe('123456.78');
    const rate: HTMLInputElement = fixture.nativeElement.querySelector('#rate');
    rate.value = '۱۰۱'; rate.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.form.controls.rate.hasError('max')).toBeTrue();
    rate.value = '۹'; rate.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.form.controls.rate.value).toBe(9);
    expect(fixture.componentInstance.form.controls.rate.valid).toBeTrue();
    input.value = 'نامعتبر'; input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.form.controls.money.hasError('persianNumber')).toBeTrue();
  });
});
