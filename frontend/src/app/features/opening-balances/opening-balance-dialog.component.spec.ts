import { TestBed } from '@angular/core/testing';
import { provideHttpClient,withInterceptors } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';
import { OpeningBalanceDialogComponent,OpeningDialogData } from './opening-balance-dialog.component';
import { OpeningBalancesService } from '../../core/services/opening-balances.service';
import { authInterceptor } from '../../core/interceptors/auth.interceptor';
import { AuthService } from '../../core/services/auth.service';
describe('Opening balance API and safe saves',()=>{
  let http:HttpTestingController;let ref:any;let data:OpeningDialogData;
  beforeEach(()=>{
    ref={close:jasmine.createSpy('close'),disableClose:false};
    data={kind:'contacts',row:null,date:'2020-01-02',contactId:2,itemId:1,warehouseId:3,contacts:[{id:2,name:"طرف حساب"}],items:[{id:1,name:"کالا",type:1}],warehouses:[{id:3,name:"انبار"}],onConflict:jasmine.createSpy('onConflict')};
    TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting(),{provide:AuthService,useValue:{getToken:()=> 'test-token',isTokenExpired:()=>false}},{provide:MAT_DIALOG_DATA,useValue:data},{provide:MatDialogRef,useValue:ref}]});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  const create=()=>TestBed.runInInjectionContext(()=>new OpeningBalanceDialogComponent());
  it('requires an explicit direction, then sends positive amount and false as a valid direction',()=>{
    const form=create();form.form.controls.amount.setValue('50000000.00');expect(form.form.invalid).toBeTrue();
    form.form.controls.isDebit.setValue(false);expect(form.form.valid).toBeTrue();form.save();form.save();
    const req=http.expectOne(r=>r.url.endsWith('/opening-balances/contacts'));
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');expect(req.request.responseType).toBe('text');
    expect(req.request.body).toEqual({contactId:2,dateUtc:'2020-01-02T00:00:00Z',amount:'50000000.00',isDebit:false,note:null});
    req.flush('{"id":1,"branchId":2,"amount":50000000,"rowVersionBase64":"new"}');expect(ref.close).toHaveBeenCalled();
  });
  it('sends unitCost null for unknown valuation and keeps quantity precise',()=>{
    data.kind='inventory';const form=create();form.form.controls.quantity.setValue('10.001');form.save();
    const req=http.expectOne(r=>r.url.endsWith('/opening-balances/inventory'));
    expect(req.request.body.unitCost).toBeNull();expect(req.request.body.quantity).toBe('10.001');expect(req.request.body.branchId).toBeUndefined();
    req.flush('{"id":1,"branchId":1,"quantity":10.001,"unitCost":null,"totalCost":null,"valuationPending":true}');
  });
  it('blocks another POST after unknown network result until filtered GET verifies absence',()=>{
    const form=create();form.form.patchValue({amount:'1',isDebit:true});form.save();
    http.expectOne(r=>r.method==='POST').error(new ProgressEvent('error'));
    expect(form.uncertain).toBeTrue();form.save();http.expectNone(r=>r.method==='POST');
    form.verifyPrevious();const check=http.expectOne(r=>r.method==='GET');expect(check.request.params.get('contactId')).toBe('2');check.flush('[]');
    expect(form.uncertain).toBeFalse();form.save();http.expectOne(r=>r.method==='POST').flush('{"id":2,"branchId":1}');
  });
  it('sends the full update with version and requires reload after conflict',()=>{
    data.row={id:7,branchId:1,dateUtc:'2020-01-02T00:00:00Z',contactId:2,warehouseId:null,itemId:null,amount:'100',isDebit:true,quantity:null,unitCost:null,totalCost:null,valuationPending:false,note:null,rowVersionBase64:'old'};
    const form=create();form.save();const req=http.expectOne(r=>r.url.endsWith('/contacts/7'));expect(req.request.method).toBe('PUT');expect(req.request.body.rowVersionBase64).toBe('old');
    req.flush('{"detail":"تعارض نسخه"}',{status:409,statusText:'Conflict'});expect(data.onConflict).toHaveBeenCalled();expect(form.conflict).toBeTrue();form.save();http.expectNone(r=>r.method==='PUT');
    form.reloadLatest();http.expectOne(r=>r.method==='GET').flush(JSON.stringify([{...data.row,amount:200,rowVersionBase64:'new'}]));
    expect(form.form.value.amount).toBe('200');expect(form.conflict).toBeFalse();form.save();const updated=http.expectOne(r=>r.method==='PUT');expect(updated.request.body.rowVersionBase64).toBe('new');updated.flush('{"id":7,"branchId":1}');
  });
  it('encodes delete version in the query and does not invent paging parameters',()=>{
    const service=TestBed.inject(OpeningBalancesService);service.list('inventory',{warehouseId:3,itemId:1,contactId:2}).subscribe();const list=http.expectOne(r=>r.method==='GET');expect(list.request.params.keys()).toEqual(['warehouseId','itemId']);list.flush('[]');
    service.delete('inventory',{id:8,rowVersionBase64:'AQ+/='} as any).subscribe();const del=http.expectOne(r=>r.method==='DELETE');expect(del.request.params.get('rowVersionBase64')).toBe('AQ+/=');expect(del.request.body).toBeNull();del.flush(null,{status:204,statusText:'No Content'});
  });
});
