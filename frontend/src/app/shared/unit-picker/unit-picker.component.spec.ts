import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { UnitPickerComponent } from './unit-picker.component';

@Component({ standalone: true, imports: [UnitPickerComponent, ReactiveFormsModule], template: `<app-unit-picker [formControl]="unit" initialName="واحد قبلی"></app-unit-picker>` })
class UnitHost { unit = new FormControl<number | null>(7); }

describe('Unit picker List integration', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('queries the units endpoint with page and search, and saves unit IDs', fakeAsync(() => {
    const fixture = TestBed.createComponent(UnitHost); fixture.detectChanges(); tick(201);
    const http = TestBed.inject(HttpTestingController);
    const first = http.expectOne(request => request.url.endsWith('/units'));
    expect(first.request.params.get('page')).toBe('1'); expect(first.request.params.get('pageSize')).toBe('20');
    first.flush({ items: [{ id: 9, name: 'کیلوگرم' }], total: 1 });
    const field = fixture.debugElement.query(By.directive(UnitPickerComponent)).componentInstance as UnitPickerComponent;
    expect(field.display(field.control.value)).toBe('واحد قبلی');
    field.control.setValue('کیلو'); tick(201);
    expect(fixture.componentInstance.unit.value).toBeNull();
    const search = http.expectOne(request => request.url.endsWith('/units'));
    expect(search.request.params.get('search')).toBe('کیلو'); search.flush({ items: [{ id: 9, name: 'کیلوگرم' }], total: 1 });
    field.select({ id: 9, name: 'کیلوگرم' });
    expect(fixture.componentInstance.unit.value).toBe(9);
    field.clear(); tick(201);
    http.expectOne(request => request.url.endsWith('/units')).flush({ items: [], total: 0 });
    expect(fixture.componentInstance.unit.value).toBeNull();
    fixture.destroy();
  }));
});
