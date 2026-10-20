import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import Decimal from 'decimal.js';
import { MealPackage, MealPackageRow, MealPackagesService } from '../../core/services/meal-packages.service';
import { PermissionService } from '../../core/services/permission.service';
import { latinDigits } from '../../core/utils/persian.utils';
import { PackageSaveDialogComponent } from '../../features/invoices/package-save-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

export function expandPackage(p: MealPackage, count: string): MealPackageRow[] {
  const qty = latinDigits(count).replace(',', '.').trim();
  if (!/^\d+(\.\d{1,3})?$/.test(qty) || new Decimal(qty).lte(0) || new Decimal(qty).gt(1000000))
    throw new Error('تعداد پکیج را درست وارد کنید.');
  if (p.lines.some(l => l.available === false)) throw new Error('یکی از اقلام پکیج حذف شده است؛ ابتدا پکیج را اصلاح کنید.');
  return p.lines.map(l=>({...l,quantity:new Decimal(l.quantity).times(qty).toFixed(3)}));
}

@Component({standalone:true, selector:'app-meal-package-panel',
  imports:[CommonModule,MatFormFieldModule,MatSelectModule,MatInputModule,MatButtonModule],
  template:`
    <section class="package-panel" *ngIf="permissions.has('Item.Read')">
      <div class="package-heading"><h3>پکیج غذا و خدمات</h3><span>انتخاب سریع چند غذا و خدمت</span></div>
      <p>پکیج و تعداد آن را انتخاب کنید. اقلام مشترک به تعداد ردیف قبلی اضافه می‌شوند؛ قیمت و تخفیف همان ردیف حفظ می‌شود.</p>
      <div class="package-tools">
        <mat-form-field appearance="outline"><mat-label>پکیج آماده</mat-label><mat-select [value]="selectedId" (selectionChange)="selectedId=$event.value"><mat-option [value]="null">انتخاب کنید</mat-option><mat-option *ngFor="let p of packages" [value]="p.id">{{p.name}}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="count"><mat-label>تعداد پکیج / مهمان</mat-label><input matInput #count value="1" inputmode="decimal"></mat-form-field>
        <button mat-flat-button type="button" [disabled]="!selectedId || busy" (click)="add(count.value)">افزودن پکیج</button>
      </div>
      <button mat-stroked-button type="button" class="manage-button" (click)="managing=!managing" [attr.aria-expanded]="managing" aria-controls="package-manager">ساخت و مدیریت پکیج‌ها</button><div *ngIf="managing" id="package-manager" class="package-tools">
        <button mat-stroked-button type="button" *ngIf="permissions.has('Item.Create')" [disabled]="busy" (click)="save(false)">ساخت پکیج از ردیف‌های فعلی</button>
        <button mat-button type="button" *ngIf="permissions.has('Item.Update')" [disabled]="!selectedId || busy" (click)="save(true)">جایگزینی محتویات پکیج انتخاب‌شده</button>
        <button mat-button type="button" *ngIf="permissions.has('Item.Delete')" [disabled]="!selectedId || busy" (click)="remove()">حذف پکیج انتخاب‌شده</button>
      </div>
      <p class="error" *ngIf="error" role="alert">{{error}} <button mat-button type="button" *ngIf="loadError" (click)="load()">تلاش دوباره</button></p>
    </section>
  `,
  styles:[`.package-panel{padding:18px;border:1px solid #c6ddd4;border-radius:16px;background:#f1f8f5}.package-heading{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.package-heading h3{margin:0;color:#245a47}.package-heading span,p{font-size:12px;color:#5a7469}.package-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.package-tools mat-form-field{flex:1;min-width:160px}.package-tools .count{flex:0 1 190px}.manage-button{margin-block:12px}#package-manager{margin-top:12px}.error{color:#a82a23}@media(max-width:600px){.package-tools mat-form-field,.package-tools .count{flex-basis:100%}}`]
})
export class MealPackagePanelComponent implements OnInit {
  @Input({required:true}) readRows!: () => MealPackageRow[];
  @Output() addRows = new EventEmitter<MealPackageRow[]>();
  readonly permissions=inject(PermissionService);
  private service=inject(MealPackagesService); private dialog=inject(MatDialog); private snack=inject(MatSnackBar);
  managing=false;
  packages:MealPackage[]=[];selectedId:number|null=null;busy=false;error='';loadError=false;
  ngOnInit():void {if(this.permissions.has('Item.Read'))this.load();}
  load():void {this.loadError=false;this.error='';this.service.list().subscribe({next:p=>this.packages=p,error:()=>{this.loadError=true;this.error='دریافت پکیج‌ها ناموفق بود.';}});}
  add(count:string):void {
    const p=this.packages.find(p=>p.id===this.selectedId);if(!p)return;
    try{this.addRows.emit(expandPackage(p,count));this.selectedId=null;this.error='';}catch(e){this.error=e instanceof Error?e.message:'پکیج معتبر نیست.';}
  }
  save(update:boolean):void {
    const rows=this.readRows();if(!rows.length){this.error='ابتدا ردیف‌های معتبر غذا یا خدمت را وارد کنید.';return;}
    const existing=update?this.packages.find(p=>p.id===this.selectedId):undefined;if(update&&!existing)return;
    this.dialog.open(PackageSaveDialogComponent,{data:{existing:existing?.name},width:'500px'}).afterClosed().subscribe((name:string|undefined)=>{
      if(!name)return;this.busy=true;
      this.service.save(name,rows,existing).subscribe({next:p=>{this.busy=false;this.selectedId=p.id;this.load();this.snack.open('پکیج ذخیره شد.','بستن',{duration:3000});},error:()=>this.busy=false});
    });
  }
  remove():void {
    const p=this.packages.find(p=>p.id===this.selectedId);if(!p)return;
    this.dialog.open(ConfirmDialogComponent,{data:{title:'حذف پکیج',message:`پکیج «${p.name}» حذف شود؟ سفارش‌ها و فاکتورهای قبلی حفظ می‌شوند.`,danger:true}}).afterClosed().subscribe((ok:boolean)=>{
      if(!ok)return;this.busy=true;this.service.delete(p).subscribe({next:()=>{this.busy=false;this.selectedId=null;this.load();},error:()=>this.busy=false});
    });
  }
}
