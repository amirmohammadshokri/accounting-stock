import Decimal from 'decimal.js';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { latinDigits } from './persian.utils';
import { OpeningBalance } from '../models/opening-balance.models';
const OpeningDecimal=Decimal.clone({precision:40,rounding:Decimal.ROUND_HALF_UP});

/** Quote JSON number tokens outside strings before parsing: decimal amounts never pass through Number. */
export function parseOpeningJson(text:string): OpeningBalance | OpeningBalance[] {
  let out='',i=0,quoted=false;
  while(i<text.length){const c=text[i];
    if(quoted){out+=c;i++;if(c==='\\'){out+=text[i++] ?? '';}else if(c==='"')quoted=false;continue;}
    if(c==='"'){quoted=true;out+=c;i++;continue;}
    if(c==='-' || /[0-9]/.test(c)){const m=text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);if(!m)throw new Error('پاسخ عددی نامعتبر است.');out+=JSON.stringify(m[0]);i+=m[0].length;continue;}
    out+=c;i++;
  }
  const convert=(row:any):OpeningBalance=>{
    for(const key of ['id','branchId','contactId','warehouseId','itemId'])if(row[key]!=null){row[key]=Number(row[key]);if(!Number.isSafeInteger(row[key]))throw new Error('شناسه نامعتبر است.');}
    for(const key of ['amount','quantity','unitCost','totalCost'])if(row[key]!=null)row[key]=new OpeningDecimal(row[key]).toFixed();
    return row;
  };
  const data=JSON.parse(out);return Array.isArray(data)?data.map(convert):convert(data);
}
export function openingDayToUtc(day:string):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('تاریخ معتبر نیست.');
  const iso=day+'T00:00:00Z'; const date=new Date(iso);
  if(!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==day)throw new Error('تاریخ معتبر نیست.');
  return iso;
}
export const openingDateValidator:ValidatorFn=(control:AbstractControl):ValidationErrors|null=>{
  try{return new Date(openingDayToUtc(control.value)).getTime()>Date.now()?{futureDate:true}:null;}catch{return {date:true};}
};
export function openingDecimalValidator(scale:number,max:string,allowZero=false,optional=false):ValidatorFn {
  return control=>{const text=latinDigits(String(control.value ?? '')).trim();if(text==='')return optional?null:{required:true};
    if(!new RegExp('^\\d+(?:\\.\\d{1,'+scale+'})?$').test(text))return {decimal:true};
    const number=new OpeningDecimal(text);return number.gt(max) || (allowZero?number.lt(0):number.lte(0))?{range:true}:null;
  };
}
export function openingTotal(quantity:string,unitCost:string):string|null {
  if(!quantity || unitCost==='')return null;
  try{return new OpeningDecimal(quantity).times(unitCost).toDecimalPlaces(2,Decimal.ROUND_HALF_UP).toFixed(2);}catch{return null;}
}
export function openingError(err:any):string {
  let problem=err?.error;
  if(typeof problem==='string'){try{problem=JSON.parse(problem);}catch{problem=null;}}
  const fields=problem?.errors?Object.values(problem.errors).flat().filter(x=>typeof x==='string').join('، '):'';
  return [problem?.detail || problem?.message || (err?.status===409?'اطلاعات تغییر کرده است؛ آخرین نسخه را بازخوانی و بررسی کنید.':'انجام درخواست ناموفق بود.'),fields].filter(Boolean).join('\n');
}
