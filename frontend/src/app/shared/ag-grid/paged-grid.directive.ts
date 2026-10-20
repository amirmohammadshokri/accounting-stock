import { ColumnFilterComponent } from './column-filter.component';
import { DestroyRef, Directive, Input, OnInit, computed, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { GridApi } from 'ag-grid-community';
import { Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface PagedResult<T> { items: T[]; total: number; }
export interface ListQuery { pageNumber?: number; pageSize?: number; sort?: string; filters?:string; }

/** Pages own their AG Grid; this directive only manages server queries. */
@Directive({ selector: 'ag-grid-angular[appPagedGrid]', standalone: true, exportAs: 'appPagedGrid' })
export class PagedGridDirective<T> implements OnInit {
  private grid = inject(AgGridAngular<T>);
  private destroy = inject(DestroyRef);
  private requests = new Subject<void>();
  private api?: GridApi<T>;
  @Input({ required: true, alias: 'appPagedGrid' }) fetcher!: (query: ListQuery) => Observable<PagedResult<T>>;
  @Input() sortWhitelist: string[] = [];
  @Input() pageSizeInit = 25;
  readonly pageNumber = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasMore = computed(() => this.pageNumber() * this.pageSize() < this.total());
  private sort?: string;
  private filters?:string;


  ngOnInit() {
    this.pageSize.set(this.pageSizeInit);
    this.requests.pipe(
      tap(() => { this.loading.set(true); this.error.set(null); this.api?.setGridOption('loading', true); }),
      switchMap(() => this.fetcher({ pageNumber: this.pageNumber(), pageSize: this.pageSize(), sort: this.sort,filters:this.filters }).pipe(
        catchError((error:unknown) => { const detail=(error as {error?:{detail?:unknown}})?.error?.detail;this.error.set(typeof detail==='string'?detail:'بارگذاری رکوردها ناموفق بود.'); return of({ items: [] as T[], total: 0 }); })
      )), takeUntilDestroyed(this.destroy)
    ).subscribe(result => {
      this.total.set(result.total ?? 0);
      const lastPage = Math.max(1, Math.ceil(this.total() / this.pageSize()));
      if (this.pageNumber() > lastPage) { this.pageNumber.set(lastPage); this.reload(); return; }
      this.api?.setGridOption('rowData', result.items ?? []);
      this.api?.setGridOption('loading', false);
      this.loading.set(false);
    });
    this.grid.gridReady.pipe(takeUntilDestroyed(this.destroy)).subscribe(event => { this.api = event.api;
      event.api.setGridOption('defaultColDef',{...event.api.getGridOption('defaultColDef'),filter:ColumnFilterComponent,filterParams:{remote:true}});
      const columns=event.api.getColumnDefs();
      if(columns)event.api.setGridOption('columnDefs',columns.map(column=>{
        if('children' in column)return column;
        if(column.filter===false||(!column.field&&!column.colId)||column.colId==='actions')return {...column,filter:false};
        return {...column,filter:ColumnFilterComponent,filterParams:{remote:true}};
      }));
      this.reload(); });
    this.grid.filterChanged.pipe(takeUntilDestroyed(this.destroy)).subscribe(()=>{
      const model=this.api?.getFilterModel()??{};this.filters=Object.keys(model).length?JSON.stringify(model):undefined;
      this.pageNumber.set(1);this.reload();
    });
    this.grid.sortChanged.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => {
      if (!this.api) return;
      const state = this.api.getColumnState().filter(column => column.sort && this.sortWhitelist.includes(column.colId)).sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
      this.sort = state.map(column => `${column.colId}:${column.sort}`).join(',') || undefined;
      this.pageNumber.set(1); this.reload();
    });
  }
  clearColumnFilters():void{this.api?.setFilterModel(null);}
  reload() { if (this.api) this.requests.next(); }
  sizeColumnsToFit() { this.api?.sizeColumnsToFit(); }
  changePage(index: number, size: number) { this.pageNumber.set(index + 1); this.pageSize.set(size); this.reload(); }
}
