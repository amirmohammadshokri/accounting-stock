import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from './auth.service';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoicePrintService } from './invoice-print.service';
import { HANDLE_ERROR_LOCALLY } from '../interceptors/http-problem-interceptor';

describe('Invoice PDF download', () => {
  let service: InvoicePrintService;
  let http: HttpTestingController;
  let snack: jasmine.SpyObj<MatSnackBar>;
  beforeEach(() => {
    snack = jasmine.createSpyObj('MatSnackBar', ['open']);
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
      { provide: AuthService, useValue: { getToken: () => 'test-token', isTokenExpired: () => false } }, { provide: MatSnackBar, useValue: snack }] });
    service = TestBed.inject(InvoicePrintService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('downloads the authenticated PDF once and releases its object URL', fakeAsync(() => {
    const create = spyOn(URL, 'createObjectURL').and.returnValue('blob:test-invoice');
    const revoke = spyOn(URL, 'revokeObjectURL');
    const click = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function(this: HTMLAnchorElement) {
      expect(this.download).toBe('invoice-42.pdf');
      expect(this.href).toBe('blob:test-invoice');
      expect(this.isConnected).toBeTrue();
    });
    service.download(42); service.download(42);
    expect(service.isDownloading(42)).toBeTrue();
    const request = http.expectOne(r => r.url.endsWith('/invoices/42/pdf'));
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.context.get(HANDLE_ERROR_LOCALLY)).toBeTrue();
    request.flush(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    expect(service.isDownloading(42)).toBeFalse();
    expect(create).toHaveBeenCalled(); expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download="invoice-42.pdf"]')).toBeNull();
    tick(60000); expect(revoke).toHaveBeenCalledWith('blob:test-invoice');
  }));

  it('shows the backend validation details and permits retry after failure', async () => {
    const create = spyOn(URL, 'createObjectURL');
    const problem = new Blob([JSON.stringify({detail:'شناسه ملی شرکت تکمیل نشده است.'})], {type:'application/problem+json'});
    const parsed = problem.text();
    spyOn(problem,'text').and.returnValue(parsed);
    service.download(7);
    http.expectOne(r => r.url.endsWith('/invoices/7/pdf')).flush(
      problem,
      { status: 400, statusText: 'Bad Request' }
    );
    await parsed;
    expect(service.isDownloading(7)).toBeFalse();
    expect(snack.open).toHaveBeenCalledWith('شناسه ملی شرکت تکمیل نشده است.', 'بستن', jasmine.any(Object));
    expect(create).not.toHaveBeenCalled();
    service.download(7);
    http.expectOne(r => r.url.endsWith('/invoices/7/pdf')).flush(new Blob(['{}'], { type: 'application/json' }));
    expect(create).not.toHaveBeenCalled();
    expect(service.isDownloading(7)).toBeFalse();
  });
  it('opens the Blob preview without a token in its URL and cleans up', fakeAsync(() => {
    const preview = { opener: {}, document: { title: '', body: { textContent: '' }, documentElement: { dir: '' } }, closed: false, location: { replace: jasmine.createSpy('replace') }, close: jasmine.createSpy('close') };
    spyOn(window, 'open').and.returnValue(preview as unknown as Window);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:invoice-preview');
    const revoke = spyOn(URL, 'revokeObjectURL');
    service.open(42);
    const request = http.expectOne(r => r.url.endsWith('/invoices/42/pdf'));
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(service.isDownloading(42)).toBeTrue();
    request.flush(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    expect(preview.opener).toBeNull();
    expect(preview.location.replace).toHaveBeenCalledWith('blob:invoice-preview');
    expect(service.isDownloading(42)).toBeFalse();
    tick(300000); expect(revoke).toHaveBeenCalledWith('blob:invoice-preview');
  }));

  it('does not request a PDF when the preview popup is blocked', () => {
    spyOn(window, 'open').and.returnValue(null);
    service.open(42);
    http.expectNone(r => r.url.endsWith('/pdf'));
    expect(service.isDownloading(42)).toBeFalse();
    expect(snack.open).toHaveBeenCalled();
  });

  it('sends the selected paper format for download', fakeAsync(() => {
    spyOn(URL,'createObjectURL').and.returnValue('blob:a5');
    spyOn(URL,'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype,'click');
    service.download(42,'a5-portrait');
    const req = http.expectOne(r=>r.url.endsWith('/invoices/42/pdf'));
    expect(req.request.params.get('format')).toBe('a5-portrait');
    req.flush(new Blob(['%PDF-1.7'],{type:'application/pdf'}));
    tick(60000);
  }));
  it('previews unsaved layout via POST without saving it', fakeAsync(() => {
    const preview = { opener:null, document:{title:'',body:{textContent:''},documentElement:{dir:''}}, closed:false, location:{replace:jasmine.createSpy('replace')}, close:jasmine.createSpy('close') };
    spyOn(window,'open').and.returnValue(preview as unknown as Window);
    spyOn(URL,'createObjectURL').and.returnValue('blob:draft'); spyOn(URL,'revokeObjectURL');
    const draft = {format:'a4-portrait' as const,title:'عنوان جدید',fontSize:9,margin:0.7,headerColor:'#eeeeee',showCode:false,showDiscount:true,showSignatures:true};
    service.open(42,'a4-portrait',draft);
    const req = http.expectOne(r=>r.url.endsWith('/invoice-print-layouts/preview/42'));
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual(draft);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(new Blob(['%PDF-1.7'],{type:'application/pdf'})); tick(300000);
  }));

});
