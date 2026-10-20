import { TestBed } from '@angular/core/testing';
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
});
