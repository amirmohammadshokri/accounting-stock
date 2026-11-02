import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BranchContextService } from '../services/branch-context.service';
import { branchContextInterceptor } from './branch-context.interceptor';
import { environment } from '../../../environments/environment';

describe('branch context requests',()=>{
  let http:HttpClient;let mock:HttpTestingController;let branches:BranchContextService;
  beforeEach(()=>{
    localStorage.clear();sessionStorage.clear();
    TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([branchContextInterceptor])),provideHttpClientTesting()]});
    http=TestBed.inject(HttpClient);mock=TestBed.inject(HttpTestingController);branches=TestBed.inject(BranchContextService);
    branches.select({id:3,name:'Three',isHeadquarters:false},9,true);
  });
  afterEach(()=>{mock.verify();localStorage.clear();sessionStorage.clear();});
  it('sends the selected branch on operations',()=>{
    http.post(`${environment.apiBaseUrl}/orders`,{}).subscribe();
    const req=mock.expectOne(`${environment.apiBaseUrl}/orders`);
    expect(req.request.headers.get('X-Branch-Id')).toBe('3');
    expect(req.request.headers.has('X-Branch-Scope')).toBeFalse();req.flush({});
  });
  it('uses explicit all scope only on reads and removes the default branch filter',()=>{
    branches.allBranches.set(true);
    http.get(`${environment.apiBaseUrl}/invoices`,{params:{branchId:3}}).subscribe();
    const req=mock.expectOne(`${environment.apiBaseUrl}/invoices`);
    expect(req.request.headers.get('X-Branch-Scope')).toBe('all');req.flush({});
    http.post(`${environment.apiBaseUrl}/orders`,{}).subscribe();
    const write=mock.expectOne(`${environment.apiBaseUrl}/orders`);
    expect(write.request.headers.has('X-Branch-Scope')).toBeFalse();write.flush({});
  });
  it('does not send the selection to authentication or external services',()=>{
    http.get(`${environment.apiBaseUrl}/auth/branches`).subscribe();
    const req=mock.expectOne(`${environment.apiBaseUrl}/auth/branches`);
    expect(req.request.headers.has('X-Branch-Id')).toBeFalse();req.flush({});
    http.get('https://example.com').subscribe();
    const external=mock.expectOne('https://example.com');
    expect(external.request.headers.has('X-Branch-Id')).toBeFalse();external.flush({});
  });
});
