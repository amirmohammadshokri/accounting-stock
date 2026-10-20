import { filterAllRows } from '../../shared/ag-grid/column-filter.component';
import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { Component,ViewChild,inject,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog,MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { catchError,map,of } from 'rxjs';
import { OpeningBalance,OpeningKind,OpeningReference } from '../../core/models/opening-balance.models';
import { OpeningBalancesService } from '../../core/services/opening-balances.service';
import { PermissionService } from '../../core/services/permission.service';
import { openingError } from '../../core/utils/opening-balance.utils';
import { formatPersianNumber,persianDigits } from '../../core/utils/persian.utils';
import { GridPaginatorComponent } from '../../shared/ag-grid/grid-paginator.component';
import { PagedGridDirective } from '../../shared/ag-grid/paged-grid.directive';
import { EntityActionsCell } from '../../shared/ag-grid/entity-actions.cell';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { OpeningEntitySelectComponent } from './opening-entity-select.component';
import { OpeningReferencesService } from './opening-references.service';
import { OpeningBalanceDialogComponent,OpeningDialogData } from './opening-balance-dialog.component';

@Component({standalone:true,selector:'app-opening-balances-page',imports:[FilterPanelComponent, FormsModule,MatTabsModule,MatButtonModule,MatDialogModule,AgGridAngular,GridPaginatorComponent,PagedGridDirective,PersianDateFieldComponent,OpeningEntitySelectComponent],template:`
  <h2>اطلاعات اول دوره</h2><p>مانده و موجودی هنگام شروع کار را وارد کنید. مبالغ ریال‌اند؛ این صفحه برای شروع مجدد سال مالی نیست.</p>
  <app-persian-date-field label="تاریخ پیش‌فرض ثبت‌های جدید" mode="date" [(ngModel)]="defaultDate"></app-persian-date-field>
  <mat-tab-group [selectedIndex]="tabIndex" (selectedIndexChange)="switchTab($event)">
    @if(canReadContacts){<mat-tab label="طرف حساب‌ها"></mat-tab>}
    @if(canReadInventory){<mat-tab label="موجودی کالاها"></mat-tab>}
  </mat-tab-group>
  <app-filter-panel (apply)="reload()" (reset)="reset()">
@if(kind==='contacts'){<app-opening-entity-select label="طرف حساب" [rows]="contacts" [(value)]="contactId"></app-opening-entity-select>}
    @else{<app-opening-entity-select label="انبار" [rows]="warehouses" [(value)]="warehouseId"></app-opening-entity-select><app-opening-entity-select label="کالا" [rows]="items" [(value)]="itemId"></app-opening-entity-select>}

</app-filter-panel>
  @if(referenceError){<p role="alert">{{referenceError}}</p>}
  @if(listError){<p role="alert" class="error">{{listError}}</p>}
  @if(kind==='inventory'){<p>بهای خالی یعنی ارزش‌گذاری تکمیل نشده است. این مبلغ به‌تنهایی بهای تمام‌شده فروش یا سود نهایی را تعیین نمی‌کند.</p>}
  <div class="actions"><button mat-stroked-button (click)="reload()">بازخوانی</button>@if(canWrite){<button mat-flat-button [disabled]="!referencesReady" (click)="open(null)">ثبت {{kind==='contacts' ? 'مانده طرف حساب' : 'موجودی کالا'}} اول دوره</button>}</div>
  <ag-grid-angular class="app-data-grid" #grid="appPagedGrid" [columnDefs]="columns" [appPagedGrid]="fetcher" [context]="gridContext"></ag-grid-angular>
  <app-grid-paginator [grid]="grid"></app-grid-paginator>
`,styles:[`:host{display:block}app-persian-date-field{display:block;max-width:320px}.actions{display:flex;gap:12px;margin:16px 0}.error{white-space:pre-line;color:var(--mat-sys-error)}`]})
export class OpeningBalancesPageComponent implements OnInit {
  private service=inject(OpeningBalancesService);private permission=inject(PermissionService);private references=inject(OpeningReferencesService);
  private route=inject(ActivatedRoute);private dialog=inject(MatDialog);private snack=inject(MatSnackBar);
  readonly canReadContacts=this.permission.has('Contact.Read');readonly canReadInventory=this.permission.has('Stock.Read');
  readonly kinds:OpeningKind[]=[...(this.canReadContacts?['contacts' as const]:[]),...(this.canReadInventory?['inventory' as const]:[])];
  kind:OpeningKind=this.kinds[0]??'contacts';tabIndex=0;
  contactId:number|null=null;warehouseId:number|null=null;itemId:number|null=null;
  defaultDate=(()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;})();
  contacts:OpeningReference[]=[];items:OpeningReference[]=[];warehouses:OpeningReference[]=[];
  contactReady=false;itemReady=false;warehouseReady=false;referenceError:string|null=null;listError:string|null=null;
  columns:ColDef<OpeningBalance>[]=[];
  @ViewChild('grid') grid?:PagedGridDirective<OpeningBalance>;
  gridContext={onEdit:(row:OpeningBalance)=>this.open(row),onDelete:(row:OpeningBalance)=>this.remove(row)};
  get canWrite(){return this.permission.hasAll(this.kind==='contacts'?['CompanySettings.Update','Contact.Update']:['CompanySettings.Update','StockMovement.Create']);}
  get referencesReady(){return this.kind==='contacts'?this.contactReady:this.itemReady && this.warehouseReady;}
  ngOnInit(){
    const query=this.route.snapshot.queryParamMap;const requested=query.get('tab');if(this.kinds.includes(requested as OpeningKind))this.kind=requested as OpeningKind;
    this.tabIndex=this.kinds.indexOf(this.kind);
    const id=(key:string)=>{const value=Number(query.get(key));return Number.isSafeInteger(value)&&value>0?value:null;};
    this.contactId=id('contactId');this.itemId=id('itemId');this.warehouseId=id('warehouseId');this.buildColumns();
    const failed=()=>this.referenceError='دریافت نام‌ها یا فهرست انتخاب‌ها ناموفق بود؛ صفحه را بازخوانی کنید. دسترسی خواندن کالا و انبار برای ثبت موجودی لازم است.';
    if(this.canReadContacts)this.references.contactsList().subscribe({next:rows=>{this.contacts=rows;this.contactReady=true;this.grid?.reload();},error:failed});
    if(this.canReadInventory && this.permission.has('Item.Read'))this.references.itemsList().subscribe({next:rows=>{this.items=rows.filter(row=>row.type===1);this.itemReady=true;this.grid?.reload();},error:failed});
    if(this.canReadInventory && this.permission.has('Warehouse.Read'))this.references.warehousesList().subscribe({next:rows=>{this.warehouses=rows;this.warehouseReady=true;this.grid?.reload();},error:failed});
    if(this.canReadInventory && !this.permission.hasAll(['Item.Read','Warehouse.Read']))failed();
  }
  private name(rows:OpeningReference[],id:number|null){const row=rows.find(r=>r.id===id);return row?(row.code?row.code+' — ':'')+row.name:'شناسه '+persianDigits(id??'');}
  private buildColumns(){
    const decimal=(value:any)=>value==null?'—':formatPersianNumber(value);
    const common:ColDef<OpeningBalance>[]=[{field:'dateUtc',headerName:'تاریخ شروع',minWidth:150,valueFormatter:p=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(p.value))},{field:'note',headerName:'توضیح',minWidth:240}];
    this.columns=this.kind==='contacts'?[
      {colId:'contactName',headerName:'طرف حساب',minWidth:240,valueGetter:p=>p.data?this.name(this.contacts,p.data.contactId):''},
      {field:'amount',headerName:'مبلغ (ریال)',minWidth:180,valueFormatter:p=>decimal(p.value)},
      {colId:'directionLabel',headerName:'جهت مانده',minWidth:260,valueGetter:p=>p.data?.isDebit?'طرف حساب به ما بدهکار است (طلب ما)':'ما به طرف حساب بدهکاریم (بدهی ما)'},...common
    ]:[{colId:'warehouseName',headerName:'انبار',minWidth:200,valueGetter:p=>p.data?this.name(this.warehouses,p.data.warehouseId):''},
      {colId:'itemName',headerName:'کالا',minWidth:240,valueGetter:p=>p.data?this.name(this.items,p.data.itemId):''},
      {field:'quantity',headerName:'تعداد',minWidth:120,valueFormatter:p=>decimal(p.value)},
      {field:'unitCost',headerName:'بهای واحد (ریال)',minWidth:170,valueFormatter:p=>decimal(p.value)},
      {field:'totalCost',headerName:'ارزش کل (ریال)',minWidth:180,valueFormatter:p=>decimal(p.value)},
      {colId:'valuationLabel',headerName:'وضعیت ارزش‌گذاری',minWidth:190,valueGetter:p=>p.data?.valuationPending?'نیازمند تکمیل بها':'تکمیل‌شده'},...common];
    if(this.canWrite)this.columns.push({colId:'actions',headerName:'عملیات',pinned:'left',width:110,cellRenderer:EntityActionsCell});
    this.columns=this.columns.map(column=>({sortable:false,...column}));
  }
  fetcher=(query:{filters?:string;pageNumber?:number;pageSize?:number})=>{
    this.listError=null;const size=query.pageSize??25;const start=((query.pageNumber??1)-1)*size;
    return this.service.list(this.kind,{contactId:this.contactId,warehouseId:this.warehouseId,itemId:this.itemId}).pipe(map(rows=>{const all=filterAllRows(rows,query.filters,(row,key)=>key==='contactName'?this.name(this.contacts,row.contactId):key==='warehouseName'?this.name(this.warehouses,row.warehouseId):key==='itemName'?this.name(this.items,row.itemId):key==='directionLabel'?(row.isDebit?'طرف حساب به ما بدهکار است (طلب ما)':'ما به طرف حساب بدهکاریم (بدهی ما)'):key==='valuationLabel'?(row.valuationPending?'نیازمند تکمیل بها':'تکمیل‌شده'):(row as unknown as Record<string,unknown>)[key]);return {items:all.slice(start,start+size),total:all.length};}),catchError(err=>{this.listError=openingError(err);return of({items:[],total:0});}));
  };
  switchTab(index:number){const kind=this.kinds[index];if(!kind || kind===this.kind)return;this.kind=kind;this.tabIndex=index;this.buildColumns();this.reload();}
  reload(){this.grid?.changePage(0,this.grid.pageSize());}
  reset(){this.contactId=null;this.itemId=null;this.warehouseId=null;this.reload();}
  open(row:OpeningBalance|null){if(!this.canWrite)return;this.dialog.open<OpeningBalanceDialogComponent,OpeningDialogData>(OpeningBalanceDialogComponent,{width:'700px',maxWidth:'95vw',data:{kind:this.kind,row,date:this.defaultDate,contactId:this.contactId,itemId:this.itemId,warehouseId:this.warehouseId,contacts:this.contacts,items:this.items,warehouses:this.warehouses,onConflict:()=>this.reload()}}).afterClosed().subscribe(result=>{if(result){this.snack.open('اطلاعات اول دوره ثبت / به‌روزرسانی شد.','بستن',{duration:3000});this.reload();}});}
  remove(row:OpeningBalance){if(!this.canWrite)return;const kind:OpeningKind=row.contactId!=null?'contacts':'inventory';if(kind!==this.kind)return;this.dialog.open(ConfirmDialogComponent,{data:{title:'حذف اطلاعات اول دوره',message:'این رکورد حذف شود؟ اثر آن بر مانده یا موجودی برگردانده می‌شود.',danger:true}}).afterClosed().subscribe(ok=>{
    if(!ok)return;this.service.delete(kind,row).subscribe({next:()=>{this.snack.open('رکورد حذف شد.','بستن',{duration:3000});this.reload();},error:err=>{this.listError=openingError(err);if(err.status===409){this.snack.open(this.listError,'بستن',{duration:6000});this.reload();}}});
  });}
}
