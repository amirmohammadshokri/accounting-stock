import { PermissionService } from '../../core/services/permission.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DataMaintenancePageComponent } from './data-maintenance-page.component';
import { environment } from '../../../environments/environment';

describe('Admin data maintenance',()=>{
  let http:HttpTestingController;
  const url=`${environment.apiBaseUrl}/data-maintenance`;
  beforeEach(()=>{TestBed.configureTestingModule({imports:[DataMaintenancePageComponent],providers:[{provide:PermissionService,useValue:{has:()=>true}},provideHttpClient(),provideHttpClientTesting(),provideNoopAnimations()]});http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  function create(){const fixture=TestBed.createComponent(DataMaintenancePageComponent);fixture.detectChanges();return fixture;}
  it('shows the affected counts and blocks reset until the password, phrase and acknowledgement are entered',()=>{
    const fixture=create();const c=fixture.componentInstance;expect(c.canReset()).toBeFalse();
    http.expectOne(url).flush([{key:'invoices',label:'فاکتورها',count:12}]);fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('۱۲');expect(c.canReset()).toBeFalse();
    c.form.setValue({password:'Admin123!',confirmation:'اشتباه',acknowledge:true});expect(c.canReset()).toBeFalse();
    c.reset();http.expectNone(`${url}/reset`);
    c.form.controls.confirmation.setValue('پاک سازی اطلاعات');expect(c.canReset()).toBeTrue();
    c.form.controls.acknowledge.setValue(false);expect(c.canReset()).toBeFalse();
  });
  it('sends only a deliberate reset, blocks duplicate submissions and clears credentials after success',()=>{
    const fixture=create();const c=fixture.componentInstance;http.expectOne(url).flush([]);
    c.form.setValue({password:'Admin123!',confirmation:'پاک‌سازی اطلاعات',acknowledge:true});c.reset();c.reset();
    const request=http.expectOne(`${url}/reset`);expect(request.request.method).toBe('POST');expect(request.request.body.password).toBe('Admin123!');
    expect(c.busy()).toBeTrue();expect(c.canReset()).toBeFalse();request.flush({completedAtUtc:'2026-10-18T00:00:00Z',deletedRecords:30});
    expect(c.form.controls.password.value).toBe('');expect(c.form.controls.confirmation.value).toBe('');expect(c.form.controls.acknowledge.value).toBeFalse();
    expect(c.message()).toContain('پاک شد');http.expectOne(url).flush([]);
  });
  it('keeps server errors visible while reloading counts and requires confirmation again',()=>{
    const fixture=create();const c=fixture.componentInstance;http.expectOne(url).flush([]);
    c.form.setValue({password:'Wrong!',confirmation:'پاک‌سازی اطلاعات',acknowledge:true});c.reset();
    http.expectOne(`${url}/reset`).flush({detail:'رمز حساب مدیر نادرست است؛ هیچ اطلاعاتی پاک نشد.'},{status:422,statusText:'Invalid'});
    http.expectOne(url).flush([]);expect(c.error()).toContain('رمز');expect(c.canReset()).toBeFalse();expect(c.form.controls.password.value).toBe('');
  });
});
