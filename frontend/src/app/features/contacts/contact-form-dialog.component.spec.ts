import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContactFormDialogComponent } from './contact-form-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { BranchesService } from '../../core/services/branches.service';
describe('Contact identity choice',()=>{
  let close:jasmine.Spy;
  beforeEach(()=>{close=jasmine.createSpy();TestBed.configureTestingModule({providers:[
    {provide:MAT_DIALOG_DATA,useValue:{contact:null,defaultBranchId:null}},{provide:MatDialogRef,useValue:{close}},
    {provide:AuthService,useValue:{currentUser:()=>({branchId:2})}},{provide:PermissionService,useValue:{has:()=>true}},
    {provide:BranchesService,useValue:{list:()=>of([{id:2,code:'B',name:'شعبه'}])}}
  ]});});
  it('defaults to person, picks the current branch and accepts a name without formal ID',()=>{
    const form=TestBed.runInInjectionContext(()=>new ContactFormDialogComponent());expect(form.kind).toBe('person');
    form.form.patchValue({firstName:'سارا',lastName:'نمونه'});form.save();
    expect(close).toHaveBeenCalledWith(jasmine.objectContaining({branchId:2,name:'سارا نمونه',isCustomer:true,companyDetails:null,personDetails:jasmine.objectContaining({tckn:null})}));
  });
  it('switches to company without hidden person validators blocking save',()=>{
    const form=TestBed.runInInjectionContext(()=>new ContactFormDialogComponent());form.kind='company';form.onKindChange();form.form.controls.name.setValue('کترینگ بهار');form.save();
    expect(close).toHaveBeenCalledWith(jasmine.objectContaining({name:'کترینگ بهار',personDetails:null,companyDetails:jasmine.objectContaining({taxNumber:null})}));
  });
  it('normalizes Persian subscription digits and preserves leading zeros',()=>{
    const component=TestBed.runInInjectionContext(()=>new ContactFormDialogComponent());
    component.form.patchValue({firstName:'سارا',lastName:'نمونه'});
    component.normalizeSubscription({target:{value:'vip-۰۰۱۲'}} as unknown as Event);
    component.save();expect(close).toHaveBeenCalledWith(jasmine.objectContaining({subscriptionNumber:'VIP-0012'}));
  });
  it('blocks reserved automatic numbers and invalid subscription text',()=>{
    const component=TestBed.runInInjectionContext(()=>new ContactFormDialogComponent());
    component.form.patchValue({firstName:'سارا',lastName:'نمونه',subscriptionNumber:'AUTO-000001'});
    component.save();expect(close).not.toHaveBeenCalled();
  });

});
