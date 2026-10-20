import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UnitFormDialogComponent } from './unit-form-dialog.component';
import { UnitsService } from '../../core/services/units.service';

describe('Unit master data API and form',()=>{
  let http:HttpTestingController;
  let ref:{close:jasmine.Spy;disableClose:boolean};
  let data:{unit:any};
  beforeEach(()=>{
    ref={close:jasmine.createSpy('close'),disableClose:false};data={unit:null};
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),{provide:MatDialogRef,useValue:ref},{provide:MAT_DIALOG_DATA,useValue:data}]});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  it('uses page/pageSize/search for the List endpoint',()=>{
    TestBed.inject(UnitsService).list({page:2,pageSize:25,search:'کیلو'}).subscribe();
    const req=http.expectOne(r=>r.url.endsWith('/units'));expect(req.request.params.get('page')).toBe('2');expect(req.request.params.get('pageSize')).toBe('25');expect(req.request.params.get('search')).toBe('کیلو');req.flush({items:[],total:0});
  });
  it('creates trimmed data and blocks double submission',()=>{
    const form=TestBed.runInInjectionContext(()=>new UnitFormDialogComponent());
    form.form.setValue({name:' کیلوگرم ',description:' وزن '});form.save();form.save();
    const req=http.expectOne(r=>r.url.endsWith('/units'));expect(req.request.method).toBe('POST');expect(req.request.body).toEqual({name:'کیلوگرم',description:'وزن'});
    req.flush({id:9,name:'کیلوگرم',rowVersion:'new'});expect(ref.close).toHaveBeenCalledWith(jasmine.objectContaining({id:9}));
  });
  it('rejects whitespace-only and overlong names',()=>{
    const form=TestBed.runInInjectionContext(()=>new UnitFormDialogComponent());
    form.form.controls.name.setValue('   ');form.save();expect(form.form.invalid).toBeTrue();
    form.form.controls.name.setValue('x'.repeat(17));expect(form.form.invalid).toBeTrue();expect(ref.close).not.toHaveBeenCalled();
  });
  it('updates with the real ID and rowVersion and keeps values on failure',()=>{
    data.unit={id:9,name:'عدد',description:null,rowVersion:'AQID'};
    const form=TestBed.runInInjectionContext(()=>new UnitFormDialogComponent());form.form.controls.name.setValue('متر');form.save();
    const req=http.expectOne(r=>r.url.endsWith('/units/9'));expect(req.request.method).toBe('PUT');expect(req.request.body).toEqual({id:9,name:'متر',description:null,rowVersion:'AQID'});
    req.flush({detail:'نام واحد تکراری است.'},{status:422,statusText:'Unprocessable Entity'});
    expect(form.error).toBe('نام واحد تکراری است.');expect(form.form.value.name).toBe('متر');expect(form.saving).toBeFalse();expect(ref.close).not.toHaveBeenCalled();
  });
  it('deletes with rowVersion in the query and accepts 204',()=>{
    TestBed.inject(UnitsService).delete(9,'AQ+/=').subscribe();
    const req=http.expectOne(r=>r.url.endsWith('/units/9'));expect(req.request.method).toBe('DELETE');expect(req.request.params.get('rowVersion')).toBe('AQ+/=');expect(req.request.body).toBeNull();req.flush(null,{status:204,statusText:'No Content'});
  });
});
