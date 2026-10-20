import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OrderFormComponent } from './orders-form.component';
import { expandPackage } from '../../shared/meal-package-panel/meal-package-panel.component';

describe('Order packages',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient()]}));
  it('expands food and service, preserves financial rates and commits the active cell on save',()=>{
    const form=TestBed.runInInjectionContext(()=>new OrderFormComponent());
    form.value={id:7,contactId:1,dateUtc:'2026-10-18T08:00:00Z',type:1,currency:'IRR',rowVersionBase64:'old',lines:[]};form.mode='update';
    const p={id:1,name:'ناهار',rowVersion:'',lines:[{itemId:1,name:'غذا',quantity:'2',unitPrice:'100',vatRate:10,discountRate:'10',withholdingRate:20,available:true},{itemId:2,name:'خدمات',quantity:'1',unitPrice:'20',vatRate:0,discountRate:'0',withholdingRate:0,available:true}]};
    form.appendPackage(expandPackage(p,'۳'));expect(form.rowData.map(l=>l.quantity)).toEqual(['6.000','3.000']);expect(form.total).toBe('654.00');
    const stop=jasmine.createSpy().and.callFake(()=>form.rowData[0].quantity='7');(form as unknown as {linesGrid:unknown}).linesGrid={api:{stopEditing:stop}};
    const emit=spyOn(form.saveUpdate,'emit');form.onSave();expect(stop).toHaveBeenCalled();
    expect(emit.calls.mostRecent().args[0].lines[0]).toEqual(jasmine.objectContaining({quantity:'7',discountRate:'10',withholdingRate:20}));
    expect(p.lines[0].quantity).toBe('2');
  });
  it('blocks missing contact and prevents package changes in view mode',()=>{
    const form=TestBed.runInInjectionContext(()=>new OrderFormComponent());const emit=spyOn(form.saveInsert,'emit');form.onSave();expect(emit).not.toHaveBeenCalled();
    form.mode='view';form.appendPackage([{itemId:1,name:'غذا',quantity:1,unitPrice:100,vatRate:0,discountRate:0,withholdingRate:0}]);expect(form.rowData.length).toBe(0);
  });
  it('does not add packages to purchases and preserves one row per item in sales',()=>{
    const form=TestBed.runInInjectionContext(()=>new OrderFormComponent());
    form.form.controls.type.setValue(2);expect(form.packagesAllowed).toBeFalse();
    const rows=[{itemId:1,name:'غذا',quantity:2,unitPrice:100,vatRate:0,discountRate:0,withholdingRate:0}];
    form.appendPackage(rows);expect(form.rowData).toEqual([]);
    form.form.controls.type.setValue(1);form.appendPackage(rows);form.appendPackage(rows);
    expect(form.rowData.length).toBe(1);expect(form.rowData[0].quantity).toBe('4.000');
    form.onItemPicked(1);expect(form.rowData.length).toBe(1);
  });

});
