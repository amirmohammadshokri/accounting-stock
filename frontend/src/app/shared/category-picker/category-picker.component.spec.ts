import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { CategoryPickerComponent } from './category-picker.component';

@Component({ standalone: true, imports: [CategoryPickerComponent, ReactiveFormsModule], template: `<app-category-picker [formControl]="category" initialName="دسته‌بندی قبلی"></app-category-picker>` })
class CategoryHost { category = new FormControl<number | null>(7); }

describe('Category picker GetList integration', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('queries the categories endpoint with page and search, and saves category IDs', fakeAsync(() => {
    const fixture = TestBed.createComponent(CategoryHost); fixture.detectChanges(); tick(201);
    const http = TestBed.inject(HttpTestingController);
    const first = http.expectOne(request => request.url.endsWith('/categories'));
    expect(first.request.params.get('page')).toBe('1'); expect(first.request.params.get('pageSize')).toBe('20');
    first.flush({ items: [{ id: 9, name: 'مواد غذایی' }], total: 1 });
    const field = fixture.debugElement.query(By.directive(CategoryPickerComponent)).componentInstance as CategoryPickerComponent;
    expect(field.display(field.control.value)).toBe('دسته‌بندی قبلی');
    field.control.setValue('مواد'); tick(201);
    expect(fixture.componentInstance.category.value).toBeNull();
    const search = http.expectOne(request => request.url.endsWith('/categories'));
    expect(search.request.params.get('search')).toBe('مواد'); search.flush({ items: [{ id: 9, name: 'مواد غذایی' }], total: 1 });
    field.select({ id: 9, name: 'مواد غذایی' });
    expect(fixture.componentInstance.category.value).toBe(9);
    field.clear(); tick(201);
    http.expectOne(request => request.url.endsWith('/categories')).flush({ items: [], total: 0 });
    expect(fixture.componentInstance.category.value).toBeNull();
    fixture.destroy();
  }));
});
