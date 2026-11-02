import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { EntityPickerComponent } from './entity-picker.component';

describe('Additive item selection',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[{provide:MatDialog,useValue:{}}]}));
  it('clears text and results after adding an item while preserving ordinary form selections',()=>{
    const picker=TestBed.runInInjectionContext(()=>new EntityPickerComponent());
    const item={id:1,label:'غذا'};const emit=spyOn(picker.valueChange,'emit');
    picker.clearOnSelect=true;picker.control.setValue(item);picker.options=[item];
    picker.onSelected({option:{value:item}} as MatAutocompleteSelectedEvent);
    expect(emit).toHaveBeenCalledWith(1);expect(picker.control.value).toBe('');expect(picker.options).toEqual([]);
    picker.clearOnSelect=false;picker.control.setValue(item);picker.onSelected({option:{value:item}} as MatAutocompleteSelectedEvent);
    expect(picker.control.value).toEqual(item);
  });
  it('searches the same text again immediately after adding an item',fakeAsync(()=>{
    const picker=TestBed.runInInjectionContext(()=>new EntityPickerComponent());
    const item={id:1,label:'غذا'};
    const fetcher=jasmine.createSpy().and.returnValue(of([item]));
    picker.fetcher=fetcher;picker.clearOnSelect=true;picker.ngOnInit();
    picker.control.setValue('غذا');tick(250);
    picker.control.setValue(item);
    picker.onSelected({option:{value:item}} as MatAutocompleteSelectedEvent);
    // The second query arrives before the reset's debounce finishes.
    picker.control.setValue('غذا');tick(250);
    expect(fetcher.calls.allArgs()).toEqual([['غذا'],['غذا']]);
    expect(picker.options).toEqual([item]);
  }));
  it('continues searching after an API failure',fakeAsync(()=>{
    const picker=TestBed.runInInjectionContext(()=>new EntityPickerComponent());
    const item={id:2,label:'خدمت'};
    picker.fetcher=jasmine.createSpy().and.returnValues(throwError(()=>new Error('offline')),of([item]));
    picker.ngOnInit();picker.control.setValue('غذا');tick(250);
    picker.control.setValue('خدمت');tick(250);
    expect(picker.options).toEqual([item]);
  }));
  it('cancels a focus request when the user starts a new search',fakeAsync(()=>{
    const picker=TestBed.runInInjectionContext(()=>new EntityPickerComponent());
    const initial=new Subject<any[]>();const item={id:2,label:'خدمت'};
    picker.fetcher=jasmine.createSpy().and.returnValues(initial,of([item]));
    picker.ngOnInit();picker.ensureLoaded();tick(250);
    picker.control.setValue('خدمت');tick(250);
    initial.next([{id:1,label:'نتیجه قدیمی'}]);
    expect(picker.options).toEqual([item]);
  }));
});
