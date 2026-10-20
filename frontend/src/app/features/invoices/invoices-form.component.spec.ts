import { expandPackage } from '../../shared/meal-package-panel/meal-package-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermissionService } from '../../core/services/permission.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { InvoiceFormComponent } from './invoices-form.component';

describe('Invoice editing payload', () => {
  it('expands a package to independent food and service rows and applies bulk edits',()=>{
    const form=TestBed.runInInjectionContext(()=>new InvoiceFormComponent());
    const original={id:1,name:'ناهار',rowVersion:'',lines:[{itemId:1,name:'غذا',quantity:'2',unitPrice:'100',vatRate:0,discountRate:0,withholdingRate:0,available:true},{itemId:2,name:'پذیرایی',quantity:'1',unitPrice:'20',vatRate:0,discountRate:0,withholdingRate:0,available:true}]};
    form.appendPackage(expandPackage(original,'۳'));
    expect(form.rowData.map(l=>l.qty)).toEqual(['6.000','3.000']);
    expect(form.total).toBe('660.00');
    form.applyAll('discountRate','۱۰');expect(form.total).toBe('594.00');
    expect(original.lines[0].quantity).toBe('2');
    form.mode='view';expect(form.readonly()).toBeTrue();
  });
  beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),{provide:MatDialog,useValue:{}},{provide:MatSnackBar,useValue:{}},{provide:PermissionService,useValue:{has:()=>true}}]}));
  it('commits the active cell and preserves saved line IDs alongside new rows',()=>{
    const form = TestBed.runInInjectionContext(()=>new InvoiceFormComponent());
    form.mode='update';
    form.value={id:11,rowVersionBase64:'AAAA',contactId:2,dateUtc:'2026-10-14T08:00:00Z',currency:'IRR',type:1,lines:[{id:101,itemId:1,qty:'2',unitPrice:'100',vatRate:0},{id:0,itemId:19,qty:'1',unitPrice:'200',vatRate:0}]};
    const stop = jasmine.createSpy('stopEditing').and.callFake(()=>form.rowData[0].qty='3');
    (form as any).linesGrid={api:{stopEditing:stop}};
    const emit=spyOn(form.saveUpdate,'emit'); form.onSave();
    expect(stop).toHaveBeenCalled();
    expect(emit).toHaveBeenCalled();
    const payload=emit.calls.mostRecent().args[0]!;
    expect(payload.lines.map(l=>l.id)).toEqual([101,0]);
    expect(payload.lines[0].qty).toBe('3'); expect(payload.type).toBe(1);
  });
  it('sends Purchase as type 2 without changing line IDs',()=>{
    const form = TestBed.runInInjectionContext(()=>new InvoiceFormComponent());
    form.mode='update';form.value={id:11,contactId:2,dateUtc:'2026-10-14T08:00:00Z',currency:'IRR',type:2,lines:[{id:101,itemId:1,qty:'2',unitPrice:'100',vatRate:0}]};
    const emit=spyOn(form.saveUpdate,'emit');form.onSave();
    expect(emit.calls.mostRecent().args[0]!.type).toBe(2);
    expect(emit.calls.mostRecent().args[0]!.lines[0].id).toBe(101);
  });
  it('offers packages only on sales and merges overlapping items without replacing their financial terms',()=>{
    const form=TestBed.runInInjectionContext(()=>new InvoiceFormComponent());
    const rows=[{itemId:1,name:'غذا',quantity:'2',unitPrice:'100',vatRate:0,discountRate:0,withholdingRate:0}];
    for(const type of ['Purchase','SalesReturn','PurchaseReturn'] as const){form.form.controls.type.setValue(type);expect(form.packagesAllowed).toBeFalse();form.appendPackage(rows);expect(form.rowData).toEqual([]);}
    form.form.controls.type.setValue('Sales');form.appendPackage(rows);form.rowData[0].unitPrice='80';form.appendPackage(rows);
    expect(form.rowData.length).toBe(1);expect(form.rowData[0].qty).toBe('4.000');expect(form.rowData[0].unitPrice).toBe('80');
    form.onItemPicked(1);expect(form.rowData.length).toBe(1);expect(form.formError()).toContain('قبلاً');
  });

});
