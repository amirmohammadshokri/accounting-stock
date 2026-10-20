import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DateAdapter } from '@angular/material/core';
import { PersianDateFieldComponent } from './persian-date-field.component';

@Component({ standalone: true, imports: [ReactiveFormsModule, PersianDateFieldComponent], template: `<app-persian-date-field label="تاریخ سند" mode="datetime" [readonly]="readonly" [formControl]="date"></app-persian-date-field>` })
class DateHost {
  date = new FormControl('2026-10-14T13:45', Validators.required);
  readonly = false;
}

describe('Persian Material date and time field', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideNoopAnimations()] }));
  it('preserves time when selecting a calendar day and emits an ISO value', () => {
    const fixture = TestBed.createComponent(DateHost); fixture.detectChanges();
    const element = fixture.debugElement.query(By.directive(PersianDateFieldComponent));
    const field = element.componentInstance as PersianDateFieldComponent;
    const adapter = element.injector.get(DateAdapter<Date>);
    field.dateControl.setValue(adapter.createDate(1405, 7, 1));
    expect(fixture.componentInstance.date.value).toBe('2026-10-23T13:45');
    field.timeControl.setValue(adapter.parseTime('۰۹:۳۰', 'time'));
    expect(fixture.componentInstance.date.value).toBe('2026-10-23T09:30');
  });
  it('propagates disabled and readonly states and rejects invalid typed dates', () => {
    const fixture = TestBed.createComponent(DateHost); fixture.detectChanges();
    const field = fixture.debugElement.query(By.directive(PersianDateFieldComponent)).componentInstance as PersianDateFieldComponent;
    fixture.componentInstance.date.disable(); fixture.detectChanges();
    expect(field.dateControl.disabled).toBeTrue(); expect(field.timeControl.disabled).toBeTrue();
    fixture.componentInstance.date.enable(); fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = '۱۴۰۴/۱۲/۳۰'; input.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(fixture.componentInstance.date.invalid).toBeTrue();
    fixture.componentInstance.date.setValue('2026-10-14T13:45');
    fixture.componentInstance.readonly = true; fixture.detectChanges();
    expect(input.readOnly).toBeTrue();
    expect(fixture.nativeElement.querySelector('mat-datepicker-toggle button').disabled).toBeTrue();
  });
});
