import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';
import { latinDigits, jalaliInputToIso } from '../../core/utils/persian.utils';

export interface ColumnFilterModel {op:string;value:string;to?:string;}
function normalized(value:unknown):string{return latinDigits(String(value??'')).replace(/[٬,]/g,'').trim().toLocaleLowerCase();}
export function matchesColumnFilter(raw:unknown,model:ColumnFilterModel,formatted?:unknown):boolean {
  const text=normalized(raw),value=normalized(model.value);
  if(model.op==='blank')return raw==null||text==='';
  if(model.op==='notBlank')return raw!=null&&text!=='';
  if(raw==null)return false;
  let a=Number(text),b=Number(value),end=Number(normalized(model.to));
  if(typeof raw==='string'&&/^\d{4}-\d{2}-\d{2}/.test(raw)){
    const date=(v:string)=>Date.parse(/^1[2345]\d{2}[/-]/.test(v)?jalaliInputToIso(v)??'':v);
    a=Date.parse(raw.slice(0,10));b=date(value);end=date(normalized(model.to));
    if(model.op==='contains'||model.op==='equal')return a===b;
    if(model.op==='notEqual')return a!==b;
  }
  switch(model.op){
    case 'greater':return Number.isFinite(a)&&Number.isFinite(b)&&a>b;
    case 'less':return Number.isFinite(a)&&Number.isFinite(b)&&a<b;
    case 'range':return Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(end)&&a>=b&&a<=end;
    case 'equal':return text===value||normalized(formatted)===value;
    case 'notEqual':return text!==value&&normalized(formatted)!==value;
    case 'startsWith':return text.startsWith(value);
    case 'endsWith':return text.endsWith(value);
    default:return text.includes(value)||normalized(formatted).includes(value);
  }
}
export function filterAllRows<T>(rows:T[],json?:string,valueOf:(row:T,key:string)=>unknown=(row,key)=>(row as Record<string,unknown>)[key]):T[]{
  if(!json)return rows;
  const filters=JSON.parse(json) as Record<string,ColumnFilterModel>;
  return rows.filter(row=>Object.entries(filters).every(([key,model])=>matchesColumnFilter(valueOf(row,key),model)));
}

@Component({standalone:true,imports:[FormsModule],selector:'app-column-filter',
  template:`<div class="column-filter" dir="rtl"><label>شرط فیلتر<select [(ngModel)]="op"><option value="contains">شامل / برابر عدد یا تاریخ</option><option value="equal">برابر</option><option value="notEqual">نابرابر</option>@if(!numericColumn&&!dateColumn){<option value="startsWith">شروع با</option><option value="endsWith">پایان با</option>}@if(numericColumn||dateColumn){<option value="greater">بیشتر / بعد از</option><option value="less">کمتر / قبل از</option><option value="range">بین دو مقدار</option>}<option value="blank">خالی</option><option value="notBlank">خالی نباشد</option></select></label>
    @if(op!=='blank'&&op!=='notBlank'){<label>مقدار<input [class.date-value]="dateColumn" [(ngModel)]="value" maxlength="500" (keydown.enter)="apply()" placeholder="متن، عدد یا ۱۴۰۵/۰۱/۰۱"></label>}
    @if(op==='range'){<label>تا مقدار<input [class.date-value]="dateColumn" [(ngModel)]="to" maxlength="500" (keydown.enter)="apply()"></label>}
    <div><button type="button" (click)="apply()">اعمال فیلتر</button><button type="button" (click)="clear()">پاک‌کردن</button></div><small>فیلتر چند ستون هم‌زمان قابل استفاده است. تاریخ را شمسی وارد کنید.</small></div>`,
  styles:[`.column-filter{width:250px;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--mat-sys-surface);color:var(--mat-sys-on-surface);font:12px Vazirmatn,sans-serif}.column-filter label{display:flex;flex-direction:column;gap:8px}.column-filter input,.column-filter select{width:100%;padding:10px;border:1px solid var(--mat-sys-outline-variant);border-radius:8px;background:var(--mat-sys-surface-container-lowest);color:var(--mat-sys-on-surface);font:inherit}.column-filter>div{display:flex;gap:8px}.column-filter button{border:1px solid var(--mat-sys-outline-variant);border-radius:8px;padding:10px;background:var(--mat-sys-primary-container);color:var(--mat-sys-on-primary-container);cursor:pointer;font:inherit}.column-filter .date-value{width:192px;max-width:100%}.column-filter small{line-height:1.8}`]
})
export class ColumnFilterComponent implements IFilterAngularComp {
  private params!:IFilterParams & {remote?:boolean};
  numericColumn=false;dateColumn=false;op='contains';value='';to='';private model:ColumnFilterModel|null=null;
  agInit(params:IFilterParams & {remote?:boolean}):void{this.params=params;const field=params.colDef.field??params.column.getColId();this.dateColumn=/date|utc/i.test(field);this.numericColumn=params.colDef.type==='rightAligned'||/^(id|.*Id|qty|quantity|amount|balance|unitCost|.*Price|.*Rate|total.*|.*Count)$/i.test(field);}
  isFilterActive():boolean{return this.model!==null;}
  doesFilterPass(p:IDoesFilterPassParams):boolean{return this.params.remote||!this.model?true:matchesColumnFilter(this.params.getValue(p.node),this.model,this.params.api.getCellValue({rowNode:p.node,colKey:this.params.column,useFormatter:true}));}
  getModel():ColumnFilterModel|null{return this.model;}
  setModel(model:ColumnFilterModel|null):void{this.model=model;this.op=model?.op??'contains';this.value=model?.value??'';this.to=model?.to??'';}
  apply():void{this.model=this.op==='blank'||this.op==='notBlank'||this.value.trim()?{op:this.op,value:this.value,to:this.to}:null;this.params.filterChangedCallback();}
  clear():void{this.setModel(null);this.params.filterChangedCallback();}
}
