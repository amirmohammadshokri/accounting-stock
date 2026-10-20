import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick, flushMicrotasks, discardPeriodicTasks } from '@angular/core/testing';
import { AgGridAngular } from 'ag-grid-angular';
import { GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ColumnFilterComponent, filterAllRows, matchesColumnFilter } from './column-filter.component';
import { IFilterParams } from 'ag-grid-community';

describe('Column filters',()=>{
  it('handles Persian amounts, date ranges, empty values and multi-column matches before local pagination',()=>{
    expect(matchesColumnFilter('1200',{op:'greater',value:'۱٬۰۰۰'})).toBeTrue();
    expect(matchesColumnFilter('2026-03-21T10:00:00Z',{op:'equal',value:'۱۴۰۵/۰۱/۰۱'})).toBeTrue();
    expect(matchesColumnFilter(null,{op:'blank',value:''})).toBeTrue();
    const result=filterAllRows([{name:'غذا',amount:100},{name:'غذا',amount:300},{name:'خدمات',amount:400}],JSON.stringify({name:{op:'contains',value:'غذا'},amount:{op:'range',value:'200',to:'500'}}));
    expect(result).toEqual([{name:'غذا',amount:300}]);
  });
  it('keeps server rows visible while passing the active filter model to the paged query',()=>{
    const filter=new ColumnFilterComponent();const changed=jasmine.createSpy();
    filter.agInit({remote:true,colDef:{field:'amount'},filterChangedCallback:changed} as unknown as IFilterParams & {remote:boolean});
    filter.op='greater';filter.value='100';filter.apply();
    expect(filter.getModel()).toEqual(jasmine.objectContaining({op:'greater',value:'100'}));
    expect(filter.doesFilterPass({} as never)).toBeTrue();expect(changed).toHaveBeenCalledTimes(1);
    filter.clear();expect(filter.getModel()).toBeNull();
  });
});

ModuleRegistry.registerModules([AllCommunityModule]);
@Component({standalone:true,imports:[AgGridAngular],template:`<ag-grid-angular style="height:240px;width:600px" [rowData]="rows" [columnDefs]="columns" (gridReady)="api=$event.api" />`})
class TableHost {api?:GridApi;rows=[{amount:100},{amount:300}];columns=[{field:'amount',filter:ColumnFilterComponent,cellDataType:false}];}
describe('Rendered column filter',()=>{
  it('loads the custom filter inside AG Grid and applies it to a complete local report',fakeAsync(()=>{
    TestBed.configureTestingModule({imports:[TableHost]});
    const fixture=TestBed.createComponent(TableHost);fixture.detectChanges();tick(100);
    const api=fixture.componentInstance.api!;expect(api).toBeDefined();
    let filter:ColumnFilterComponent|undefined;
    api.getColumnFilterInstance<ColumnFilterComponent>('amount').then(value=>filter=value??undefined);flushMicrotasks();
    expect(filter).toBeDefined();filter!.op='greater';filter!.value='200';filter!.apply();tick(100);
    expect(api.getDisplayedRowCount()).toBe(1);expect(api.getDisplayedRowAtIndex(0)?.data.amount).toBe(300);
    fixture.destroy();discardPeriodicTasks();
  }));
});
