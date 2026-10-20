import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';

@Component({standalone:true,selector:'app-logo-upload',imports:[CommonModule,MatButtonModule,...APP_ICON_IMPORTS],
  providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>LogoUploadComponent),multi:true}],
  template:`<div class="upload"><div class="preview"><img *ngIf="preview" [src]="preview" alt="پیش‌نمایش لوگو"><mat-icon *ngIf="!preview" [svgIcon]="'add_photo_alternate'"></mat-icon></div><div class="upload-body"><strong>لوگو را پیوست کنید</strong><p>تصویر PNG یا JPEG، حداکثر ۳۰۰ کیلوبایت</p><div class="buttons"><button mat-stroked-button type="button" (click)="file.click()" [disabled]="disabled || reading"><mat-icon [svgIcon]="'attach_file'"></mat-icon>{{reading ? 'در حال خواندن…' : value ? 'تغییر تصویر' : 'انتخاب فایل تصویر'}}</button><button mat-button type="button" *ngIf="value" (click)="clear()" [disabled]="disabled">حذف لوگو</button></div><input #file type="file" hidden accept="image/png,image/jpeg" (change)="select($event)"><p *ngIf="value && !preview">برای جایگزینی لوگوی قبلی، تصویر جدید پیوست کنید.</p><p *ngIf="error" class="error" role="alert">{{error}}</p></div></div>`,
  styles:[`:host{display:block}.upload{display:flex;gap:16px;align-items:center;border:1px dashed #a5c4b8;border-radius:16px;background:#f2f8f5;padding:16px}.preview{width:92px;height:92px;flex-shrink:0;display:grid;place-items:center;background:white;border:1px solid #d8e5dd;border-radius:12px;overflow:hidden}.preview img{width:100%;height:100%;object-fit:contain}.preview mat-icon{font-size:34px;width:34px;height:34px;color:#5e8c78}.upload-body{min-width:0}.upload p{font-size:12px;color:#60786c;margin:6px 0}.buttons{display:flex;gap:8px;flex-wrap:wrap}.upload .error{color:#b3261e}@media(max-width:450px){.upload{flex-direction:column;align-items:stretch}.preview{align-self:center}}`]
})
export class LogoUploadComponent implements ControlValueAccessor {
  value:string|null=null;disabled=false;reading=false;error='';private selection=0;
  private changed:(value:string|null)=>void=()=>{};private touched:()=>void=()=>{};
  get preview():string|null{return this.value?.startsWith('data:image/png;base64,')||this.value?.startsWith('data:image/jpeg;base64,')?this.value:null;}
  writeValue(value:string|null):void{this.value=value;}
  registerOnChange(fn:(value:string|null)=>void):void{this.changed=fn;}
  registerOnTouched(fn:()=>void):void{this.touched=fn;}
  setDisabledState(disabled:boolean):void{this.disabled=disabled;}
  clear():void{if(this.disabled)return;this.selection++;this.value=null;this.error='';this.changed(null);this.touched();}
  select(event:Event):void{
    if(this.disabled)return;const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;this.error='';this.touched();
    if(!['image/png','image/jpeg'].includes(file.type)||file.size>307200){this.error='یک تصویر PNG یا JPEG با حجم حداکثر ۳۰۰ کیلوبایت انتخاب کنید.';input.value='';return;}
    const request=++this.selection;this.reading=true;const reader=new FileReader();
    reader.onload=()=>{if(request!==this.selection)return;this.reading=false;const image=new Image();image.onload=()=>{if(request!==this.selection)return;if(image.width>4096||image.height>4096){this.error='ابعاد لوگو حداکثر ۴۰۹۶ پیکسل است.';return;}this.value=String(reader.result);this.changed(this.value);};image.onerror=()=>this.error='فایل انتخاب‌شده تصویر معتبر نیست.';image.src=String(reader.result);input.value='';};
    reader.onerror=()=>{this.reading=false;this.error='خواندن تصویر ناموفق بود.';};reader.readAsDataURL(file);
  }
}
