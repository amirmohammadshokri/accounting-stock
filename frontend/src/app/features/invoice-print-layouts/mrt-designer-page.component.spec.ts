import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { MrtDesignerPageComponent } from './mrt-designer-page.component';
import { environment } from '../../../environments/environment';

describe('MRT designer host',()=>{
  let http:HttpTestingController;
  const url=`${environment.apiBaseUrl}/invoice-mrt/a4-portrait`;
  const document={template:'{"Pages":{}}',version:'v1',isCustom:true,data:{Invoice:[],Lines:[]}};
  beforeEach(()=>{
    TestBed.configureTestingModule({imports:[MrtDesignerPageComponent],providers:[provideHttpClient(),provideHttpClientTesting(),provideNoopAnimations(),provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap({})}}}]});
    TestBed.overrideComponent(MrtDesignerPageComponent,{set:{template:'<iframe #frame></iframe>'}});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  async function create(){
    const fixture=TestBed.createComponent(MrtDesignerPageComponent);fixture.detectChanges();
    const component=fixture.componentInstance;
    const target=component['frame']!.nativeElement.contentWindow!;
    spyOn(target,'postMessage').and.stub();
    http.expectOne(url).flush(document);await fixture.whenStable();
    component.busy.set(false);component.loaded.set(true);
    return {fixture,component,target};
  }
  function message(component:MrtDesignerPageComponent,target:Window,type:string,extra:Record<string,unknown>={}){
    window.dispatchEvent(new MessageEvent('message',{source:target,origin:'null',data:{channel:component['channel'],type,...extra}}));
  }
  it('rejects messages from a different window, origin or editor instance',async()=>{
    const {component,target}=await create();
    window.dispatchEvent(new MessageEvent('message',{source:window,origin:'null',data:{channel:component['channel'],type:'save',template:'bad'}}));
    window.dispatchEvent(new MessageEvent('message',{source:target,origin:location.origin,data:{channel:component['channel'],type:'save',template:'bad'}}));
    window.dispatchEvent(new MessageEvent('message',{source:target,origin:'null',data:{channel:'wrong',type:'save',template:'bad'}}));
    http.expectNone(url);expect(component.document()?.version).toBe('v1');
  });
  it('saves the actual edited MRT with its version and updates the active print template state',async()=>{
    const {component,target,fixture}=await create();
    message(component,target,'save',{template:'{"Pages":{"edited":true}}'});
    const request=http.expectOne(url);expect(request.request.method).toBe('PUT');expect(request.request.body.version).toBe('v1');
    request.flush({template:'normalized',version:'v2'});await fixture.whenStable();
    expect(component.document()?.version).toBe('v2');expect(component.document()?.isCustom).toBeTrue();expect(component.dirty()).toBeFalse();
    expect((target.postMessage as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({type:'save-result',ok:true}));
  });
  it('keeps edits and the original version after a conflicting save',async()=>{
    const {component,target,fixture}=await create();component.dirty.set(true);
    message(component,target,'save',{template:'edited'});
    http.expectOne(url).flush({detail:'قالب توسط کاربر دیگری تغییر کرده است.'},{status:409,statusText:'Conflict'});await fixture.whenStable();
    expect(component.error()).toContain('تغییر');expect(component.dirty()).toBeTrue();expect(component.document()?.version).toBe('v1');
  });
  it('recreates the iframe when retrying a failed SDK initialization',async()=>{
    const {component,target,fixture}=await create();
    component.loaded.set(false);component['frameReady']=true;
    message(component,target,'error',{message:'کتابخانه در دسترس نیست'});
    const previous=component.frameUrl;
    const retry=component.reloadData();
    await Promise.resolve();
    http.expectOne(url).flush(document);
    await retry;await fixture.whenStable();
    expect(component.frameUrl).not.toBe(previous);
    expect(component['frameReady']).toBeFalse();
    expect(component.error()).toBe('');
  });
});
