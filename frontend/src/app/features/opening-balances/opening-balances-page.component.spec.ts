import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, UrlTree } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ModuleRegistry,AllCommunityModule,provideGlobalGridOptions } from 'ag-grid-community';
import { of } from 'rxjs';
import { OpeningBalancesPageComponent } from './opening-balances-page.component';
import { OpeningReferencesService } from './opening-references.service';
import { OpeningBalancesService } from '../../core/services/opening-balances.service';
import { PermissionService } from '../../core/services/permission.service';
import { openingBalancesGuard } from '../../core/guards/permission.guard';
import { PERSIAN_GRID } from '../../core/ag-grid/persian-grid';
ModuleRegistry.registerModules([AllCommunityModule]);provideGlobalGridOptions(PERSIAN_GRID,'deep');
describe('Opening page permissions and rendered tabs',()=>{
  let grants:Set<string>;
  let refs:any;
  beforeEach(()=>{
    grants=new Set(['Contact.Read']);
    refs={contactsList:jasmine.createSpy().and.returnValue(of([{id:2,name:'طرف حساب'}])),itemsList:jasmine.createSpy().and.returnValue(of([{id:1,name:'کالا',type:1},{id:2,name:'خدمت',type:2}])),warehousesList:jasmine.createSpy().and.returnValue(of([{id:3,name:'انبار'}]))};
    TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap({})}}},{provide:PermissionService,useValue:{has:(p:string)=>grants.has(p),hasAll:(p:string[])=>p.every(x=>grants.has(x)),hasAny:(p:string[])=>p.some(x=>grants.has(x))}},{provide:OpeningReferencesService,useValue:refs},{provide:OpeningBalancesService,useValue:{list:()=>of([])}}]});
  });
  it('renders read-only contact data without inventory tab or write actions',fakeAsync(()=>{
    const fixture=TestBed.createComponent(OpeningBalancesPageComponent);fixture.detectChanges();tick(100);fixture.detectChanges();
    const page=fixture.componentInstance;expect(page.kinds).toEqual(['contacts']);expect(page.canWrite).toBeFalse();expect(page.columns.some(c=>c.colId==='actions')).toBeFalse();
    const el=fixture.nativeElement as HTMLElement;expect(el.textContent).toContain('اطلاعات اول دوره');expect(el.querySelectorAll('[role=tab]').length).toBe(1);
    expect(refs.itemsList).not.toHaveBeenCalled();expect(refs.warehousesList).not.toHaveBeenCalled();fixture.destroy();discardPeriodicTasks();
  }));
  it('offers only inventory items and requires both write permissions',()=>{
    grants=new Set(['Stock.Read','Item.Read','Warehouse.Read','StockMovement.Create']);
    const page=TestBed.runInInjectionContext(()=>new OpeningBalancesPageComponent());page.ngOnInit();
    expect(page.kind).toBe('inventory');expect(page.items.map(x=>x.id)).toEqual([1]);expect(page.canWrite).toBeFalse();
    grants.add('CompanySettings.Update');expect(page.canWrite).toBeTrue();
  });
  it('does not allow the route with write permissions alone',()=>{
    grants=new Set(['CompanySettings.Update','Contact.Update']);
    const result=TestBed.runInInjectionContext(()=>openingBalancesGuard({} as any,{} as any));expect(result instanceof UrlTree).toBeTrue();
    grants.add('Stock.Read');expect(TestBed.runInInjectionContext(()=>openingBalancesGuard({} as any,{} as any))).toBeTrue();
  });
});
