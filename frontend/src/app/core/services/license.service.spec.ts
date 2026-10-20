import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { LicenseService } from './license.service';
import { environment } from '../../../environments/environment';

describe('Software license',()=>{
  let service:LicenseService;let http:HttpTestingController;let router:jasmine.SpyObj<Router>;
  beforeEach(()=>{
    router=jasmine.createSpyObj<Router>('Router',['navigateByUrl']);
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),{provide:Router,useValue:router}]});
    service=TestBed.inject(LicenseService);http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  it('uses the server decision and opens the expiry page, independent of browser clock',()=>{
    service.reload();http.expectOne(`${environment.apiBaseUrl}/license`).flush({expiresAtUtc:'2099-01-01T00:00:00Z',serverTimeUtc:'2099-01-02T00:00:00Z',isExpired:true,remainingDays:0,showWarning:false});
    expect(service.isExpired()).toBeTrue();expect(router.navigateByUrl).toHaveBeenCalledWith('/license-expired');
  });
  it('preserves the expired state on network failure and only unlocks after server-confirmed renewal',()=>{
    service.markExpired();service.reload();http.expectOne(`${environment.apiBaseUrl}/license`).flush({}, {status:503,statusText:'Unavailable'});
    expect(service.isExpired()).toBeTrue();expect(service.error()).toBeTrue();
    const active=jasmine.createSpy('active');service.reload(active);http.expectOne(`${environment.apiBaseUrl}/license`).flush({expiresAtUtc:null,serverTimeUtc:'2026-10-18T00:00:00Z',isExpired:false,remainingDays:null,showWarning:false});
    expect(service.isExpired()).toBeFalse();expect(active).toHaveBeenCalled();
  });
});
