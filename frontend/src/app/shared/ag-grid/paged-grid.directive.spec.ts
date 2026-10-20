import { TestBed } from '@angular/core/testing';
import { AgGridAngular } from 'ag-grid-angular';
import { Subject, of, throwError } from 'rxjs';
import { PagedGridDirective } from './paged-grid.directive';
import { PersianPaginatorIntl } from './grid-paginator.component';

describe('Direct AG Grid server paging', () => {
  let ready: Subject<any>;
  let sort: Subject<any>;
  let filters:Subject<any>;
  let api: { setGridOption: jasmine.Spy; getColumnState: jasmine.Spy;getColumnDefs:jasmine.Spy;getFilterModel:jasmine.Spy;setFilterModel:jasmine.Spy;getGridOption:jasmine.Spy };
  beforeEach(() => {
    ready = new Subject(); sort = new Subject();filters=new Subject();
    api = {getGridOption:jasmine.createSpy().and.returnValue({}),getColumnDefs:jasmine.createSpy().and.returnValue([]),getFilterModel:jasmine.createSpy().and.returnValue({}),setFilterModel:jasmine.createSpy(), setGridOption: jasmine.createSpy(), getColumnState: jasmine.createSpy().and.returnValue([]) };
    TestBed.configureTestingModule({ providers: [{ provide: AgGridAngular, useValue: { gridReady: ready, sortChanged: sort,filterChanged:filters } }] });
  });
  it('cancels stale page requests and sends only allowed sort fields to the API', () => {
    const grid = TestBed.runInInjectionContext(() => new PagedGridDirective<{ id: number }>());
    const first = new Subject<any>(), second = new Subject<any>();
    const fetcher = jasmine.createSpy().and.returnValues(first, second, of({ items: [], total: 100 }));
    grid.fetcher = fetcher; grid.sortWhitelist = ['name']; grid.ngOnInit();
    ready.next({ api });
    expect(fetcher.calls.mostRecent().args[0]).toEqual({ pageNumber: 1, pageSize: 25, sort: undefined,filters:undefined });
    grid.changePage(1, 25);
    expect(first.observed).toBeFalse();
    second.next({ items: [{ id: 2 }], total: 100 });
    expect(api.setGridOption).toHaveBeenCalledWith('rowData', [{ id: 2 }]);
    api.getColumnState.and.returnValue([{ colId: 'internal', sort: 'asc' }, { colId: 'name', sort: 'desc' }]);
    sort.next({});
    expect(fetcher.calls.mostRecent().args[0].sort).toBe('name:desc');
    expect(grid.pageNumber()).toBe(1);
  });
  it('recovers to an existing page after the last row is deleted and exposes request failures', () => {
    const grid = TestBed.runInInjectionContext(() => new PagedGridDirective());
    const fetcher = jasmine.createSpy().and.returnValues(of({ items: [], total: 26 }), of({ items: [], total: 25 }), of({ items: [{ id: 1 }], total: 25 }), throwError(() => new Error('offline')));
    grid.fetcher = fetcher; grid.ngOnInit(); ready.next({ api });
    grid.changePage(1, 25);
    expect(grid.pageNumber()).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(3);
    grid.reload();
    expect(grid.error()).toBe('بارگذاری رکوردها ناموفق بود.');
    expect(grid.loading()).toBeFalse();
  });
  it('uses Persian Material paginator labels and ranges', () => {
    const intl = new PersianPaginatorIntl();
    expect(intl.getRangeLabel(1, 25, 40)).toBe('۲۶ تا ۴۰ از ۴۰');
    expect(intl.getRangeLabel(0, 25, 0)).toBe('بدون رکورد');
  });
  it('filters the complete server result and returns to page one without client-only filtering',()=>{
    const grid=TestBed.runInInjectionContext(()=>new PagedGridDirective());
    const fetcher=jasmine.createSpy().and.returnValue(of({items:[],total:100}));grid.fetcher=fetcher;grid.ngOnInit();ready.next({api});
    grid.changePage(2,25);api.getFilterModel.and.returnValue({amount:{op:'greater',value:'500'}});filters.next({});
    expect(fetcher.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({pageNumber:1,filters:JSON.stringify({amount:{op:'greater',value:'500'}})}));
  });

});
