import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../core/app-brand';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoicePrintLayoutsService } from '../../core/services/invoice-print-layouts.service';
import { InvoicePrintService } from '../../core/services/invoice-print.service';
import { INVOICE_PRINT_FORMATS, InvoicePrintFormat } from '../../core/models/invoice-print-layout.models';
const DEFAULTS = {title:'', fontSize:9, margin:0.7, headerColor:'#e8eef7', showCode:false, showDiscount:true, showSignatures:true,
  showTax:false,showUnit:true,showLogo:true,showSeller:true,showBuyer:true,showContactDetails:true,showWords:false,showBalance:true,showNotes:true,
  minimumRows:10,rowHeight:0.55,logoPosition:'right',headerText:'',terms:'',footerText:'با سپاس از انتخاب شما',footerOrder:'summary-first',
  columnOrder:'Row,Code,Description,Quantity,Unit,UnitPrice,Discount,Vat,Total'};
@Component({standalone:true, selector:'app-invoice-print-layouts-page',
  imports:[RouterLink,CommonModule,ReactiveFormsModule,MatFormFieldModule,MatSelectModule,MatInputModule,MatButtonModule,MatCheckboxModule],
  template:`
    <h2>طراحی فاکتور کترینگ</h2>
    <a mat-flat-button routerLink="/invoice-mrt-designer" [queryParams]="{format:format,invoiceId:invoiceId.value}">بازکردن طراح کامل MRT</a>
    <p>اگر قالب MRT ذخیره کرده باشید، چاپ از همان استفاده می‌کند. برای بازگشت به تنظیمات ساده، از دکمه بازگشت در طراح MRT استفاده کنید.</p>
    <p>اندازه کاغذ را انتخاب کنید؛ بخش‌ها، متن‌ها و ستون‌ها را تغییر دهید و نتیجه را قبل از ذخیره ببینید.</p>
    <mat-form-field appearance="outline"><mat-label>اندازه چاپ</mat-label><mat-select [value]="format" (selectionChange)="load($event.value)" [disabled]="busy">
      @for(f of formats;track f.value){<mat-option [value]="f.value">{{f.label}}</mat-option>}
    </mat-select></mat-form-field>
    @if(error){<p role="alert">دریافت قالب ناموفق بود. <button mat-button (click)="load(format)">تلاش دوباره</button></p>}
    @if(loaded){
    <section class="design-options" aria-label="طرح‌های آماده فاکتور">
      <div><h3>یک طرح برای شروع انتخاب کنید</h3><p>طرح فقط ظاهر را تغییر می‌دهد؛ متن قوانین و توضیحات شما حفظ می‌شود.</p></div>
      @for(preset of presets;track preset.id){<button type="button" class="design-card" (click)="applyPreset(preset.id)" [style.border-top-color]="preset.color"><strong>{{preset.name}}</strong><span>{{preset.description}}</span></button>}
    </section>
    <div class="editor">
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline"><mat-label>عنوان دلخواه</mat-label><input matInput formControlName="title" maxlength="100" placeholder="فاکتور فروش"></mat-form-field>
        <div class="pair">
          <mat-form-field appearance="outline"><mat-label>اندازه نوشته</mat-label><input matInput type="number" formControlName="fontSize" min="7" max="12"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>حاشیه (سانتی‌متر)</mat-label><input matInput type="number" formControlName="margin" min="0.5" max="1.5" step="0.1"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>حداقل ردیف چاپ</mat-label><input matInput type="number" formControlName="minimumRows" min="10" max="30"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>ارتفاع ردیف (سانتی‌متر)</mat-label><input matInput type="number" formControlName="rowHeight" min="0.4" max="1.2" step="0.05"></mat-form-field>
        </div>
        <label class="color">رنگ سرستون‌ها <input type="color" formControlName="headerColor"></label>
        <h3>بخش‌های چاپ</h3>
        <div class="checks">
          @for(c of checks;track c.key){<mat-checkbox [formControlName]="c.key">{{c.label}}</mat-checkbox>}
        </div>
        <mat-form-field appearance="outline"><mat-label>جای لوگوی شعبه</mat-label><mat-select formControlName="logoPosition"><mat-option value="right">راست</mat-option><mat-option value="center">وسط</mat-option><mat-option value="left">چپ</mat-option></mat-select></mat-form-field>
        <p class="hint">لوگو، تلفن و نشانی را در صفحهٔ شعبه‌ها ثبت کنید.</p>
        <mat-form-field appearance="outline"><mat-label>متن بالای فاکتور</mat-label><textarea matInput formControlName="headerText" maxlength="300" rows="2"></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>قوانین و شرایط پایین چاپ</mat-label><textarea matInput formControlName="terms" maxlength="2000" rows="4" placeholder="مثلاً: تغییر تعداد سفارش تا روز قبل امکان‌پذیر است."></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>متن پایانی</mat-label><textarea matInput formControlName="footerText" maxlength="300" rows="2"></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>ترتیب پایین فاکتور</mat-label><mat-select formControlName="footerOrder"><mat-option value="summary-first">مبالغ، سپس توضیحات و قوانین</mat-option><mat-option value="terms-first">توضیحات و قوانین، سپس مبالغ</mat-option></mat-select></mat-form-field>
        <h3>ترتیب ستون‌ها از راست به چپ</h3>
        <div class="column" *ngFor="let c of orderedColumns;let i=index"><span>{{c.label}}</span><button type="button" mat-button [disabled]="i===0" (click)="moveColumn(i,-1)" aria-label="انتقال به راست">↑</button><button type="button" mat-button [disabled]="i===orderedColumns.length-1" (click)="moveColumn(i,1)" aria-label="انتقال به چپ">↓</button></div>
        <div class="actions"><button mat-flat-button type="submit" [disabled]="busy || form.invalid">ذخیره قالب</button><button mat-button type="button" (click)="reset()">بازگشت به طرح ساده</button></div>
        <h3>پیش‌نمایش واقعی چاپ</h3>
        <mat-form-field appearance="outline"><mat-label>شناسه فاکتور ذخیره‌شده</mat-label><input matInput type="number" [formControl]="invoiceId" min="1"></mat-form-field>
        <button mat-stroked-button type="button" (click)="preview()" [disabled]="form.invalid || invoiceId.invalid || print.isDownloading(invoiceId.value || 0)">مشاهده PDF با همین تغییرات</button>
        <div class="actions"><button mat-button type="button" (click)="exportLayout()">دریافت فایل طرح</button><label class="import">بارگذاری طرح<input type="file" accept=".json,application/json" (change)="importLayout($event)"></label></div>
      </form>
      <section class="preview" aria-label="پیش‌نمایش شماتیک">
        <div class="paper" [style.width.px]="format==='a5-portrait' ? 420 : 595" [style.aspect-ratio]="format==='a5-portrait' ? '148 / 210' : '210 / 297'" [style.padding.px]="form.controls.margin.value * 28.35" [style.font-size.px]="form.controls.fontSize.value * 1.33">
          <div *ngIf="form.controls.showLogo.value" class="logo" [style.text-align]="form.controls.logoPosition.value">◉ لوگوی شعبه</div>
          <div class="invoice-heading"><span>سفارش و پذیرایی</span><small>شماره: ۱۴۰۵/۱۰۱ · تاریخ: ۱۴۰۵/۰۷/۲۶</small></div><h3>{{form.controls.title.value || 'فاکتور فروش'}}</h3><p>نام شعبه · شماره فاکتور · تاریخ</p>
          <p class="multiline">{{form.controls.headerText.value}}</p>
          <p *ngIf="form.controls.showSeller.value">فروشنده: {{brand.cateringName}} <span *ngIf="form.controls.showContactDetails.value">· تلفن و نشانی</span></p>
          <p *ngIf="form.controls.showBuyer.value">خریدار: نام مشتری · اشتراک: VIP-1001 <span *ngIf="form.controls.showContactDetails.value">· تلفن و نشانی</span></p>
          <table><thead [style.background]="form.controls.headerColor.value"><tr><th *ngFor="let c of visibleColumns">{{c.label}}</th></tr></thead><tbody><tr *ngFor="let row of previewRows;let i=index" [style.height.px]="form.controls.rowHeight.value * 28.35"><td *ngFor="let c of visibleColumns">{{i<3 ? sample(c.key,i) : ''}}</td></tr></tbody></table>
          <ng-container *ngIf="form.controls.footerOrder.value==='terms-first'" [ngTemplateOutlet]="terms"></ng-container>
          <p>جمع: ۲٬۰۰۰٬۰۰۰　 تخفیف: ۰</p><p *ngIf="form.controls.showTax.value">مالیات: ۰</p><strong>قابل پرداخت: ۲٬۰۰۰٬۰۰۰ ریال</strong>
          <p *ngIf="form.controls.showBalance.value">پرداخت‌شده: ۵۰۰٬۰۰۰　مانده: ۱٬۵۰۰٬۰۰۰ ریال</p><p *ngIf="form.controls.showWords.value">دو میلیون ریال</p>
          <ng-container *ngIf="form.controls.footerOrder.value!=='terms-first'" [ngTemplateOutlet]="terms"></ng-container>
          <ng-template #terms><p *ngIf="form.controls.showNotes.value">توضیحات این سفارش</p><p class="multiline">{{form.controls.terms.value}}</p></ng-template>
          <p *ngIf="form.controls.showSignatures.value" class="sign">امضای فروشنده　　　　 امضای خریدار</p><p class="multiline">{{form.controls.footerText.value}}</p>
        </div><p class="hint">این نما تقریبی است؛ صفحه‌بندی و لوگوی واقعی را در PDF بررسی کنید.</p>
      </section>
    </div>}
  `,
  styles:[`:host{display:block}.editor{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);gap:20px;align-items:start}form{padding:20px;border:1px solid var(--mat-sys-outline-variant);background:var(--mat-sys-surface);border-radius:18px;box-sizing:border-box}form{display:flex;flex-direction:column;gap:10px;width:100%;max-width:100%}.pair,.checks{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pair mat-form-field{min-width:0}.preview{position:sticky;top:0;overflow:auto;max-width:100%;background:#dce5e3;padding:24px;border-radius:18px}.paper{max-width:100%;background:white;color:#222;box-shadow:0 2px 12px #0002;text-align:center;box-sizing:border-box;font-family:Vazirmatn,sans-serif}.paper h3{margin:4px}.paper p{margin:8px 0}.multiline{white-space:pre-wrap;overflow-wrap:anywhere}.logo{font-size:12px;color:#64748b}.sign{padding-top:15px}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #777;padding:2px;overflow-wrap:anywhere;font-size:9px}.hint{font-size:12px;color:#64748b}.actions,.color,.column{display:flex;gap:8px;align-items:center;justify-content:space-between}.column{border-bottom:1px solid #ddd}.column span{flex:1}.import{cursor:pointer;font-size:13px}.import input{max-width:180px}.design-options{display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 24px;align-items:stretch}.design-options>div{flex-basis:100%}.design-options h3{margin:0}.design-options p{font-size:12px;color:var(--mat-sys-on-surface-variant)}.design-card{flex:1;min-width:180px;display:flex;flex-direction:column;gap:10px;padding:18px;text-align:start;border:1px solid var(--mat-sys-outline-variant);border-top:7px solid;border-radius:14px;background:var(--mat-sys-surface);color:var(--mat-sys-on-surface);cursor:pointer;font:inherit}.design-card:hover,.design-card:focus-visible{outline:2px solid var(--mat-sys-primary);outline-offset:2px}.design-card span{font-size:12px;color:var(--mat-sys-on-surface-variant)}.invoice-heading{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #334b43;padding-bottom:12px;margin-bottom:14px}.invoice-heading small{font-size:9px}.paper h3{padding:10px 0}.paper th{font-weight:700;padding:7px 2px}.paper tbody tr:nth-child(even){background:#f7f9f8}@media(max-width:1150px){.editor{grid-template-columns:1fr}.preview{position:static}}.paper strong{display:block;margin-top:12px;border-top:2px solid #334b43;padding-top:12px}`]
})
export class InvoicePrintLayoutsPageComponent implements OnInit {
  readonly brand=APP_BRAND;
  readonly presets=[
    {id:'garden',name:'سبز کترینگ',description:'آرام و خوانا، مناسب سفارش روزانه',color:'#dceee5'},
    {id:'classic',name:'آبی ساده',description:'مرتب، با فضای بیشتر برای ردیف‌ها',color:'#e3ecf6'},
    {id:'economy',name:'چاپ اقتصادی',description:'خاکستری، مناسب چاپ سیاه‌وسفید',color:'#eeeeee'}
  ];
  applyPreset(id:string):void {
    const preset=this.presets.find(p=>p.id===id);if(!preset)return;
    this.form.patchValue({headerColor:preset.color,fontSize:9,margin:0.7,rowHeight:id==='classic'?0.6:0.55,minimumRows:10,
      logoPosition:id==='classic'?'center':'right',showLogo:true,showUnit:true,showCode:false,showTax:false,showWords:false});
    this.snack.open('طرح اعمال شد؛ پیش‌نمایش را بررسی کنید و ذخیره کنید.','بستن',{duration:3000});
  }
  private service=inject(InvoicePrintLayoutsService); private route=inject(ActivatedRoute); private snack=inject(MatSnackBar); private fb=inject(FormBuilder);
  readonly print=inject(InvoicePrintService); readonly formats=INVOICE_PRINT_FORMATS;
  format:InvoicePrintFormat='a4-portrait';version='';busy=false;loaded=false;error=false;
  form=this.fb.nonNullable.group({...DEFAULTS,
    title:['',Validators.maxLength(100)],fontSize:[9,[Validators.required,Validators.min(7),Validators.max(12),Validators.pattern(/^\d+$/)]],
    margin:[0.7,[Validators.required,Validators.min(0.5),Validators.max(1.5)]],minimumRows:[10,[Validators.required,Validators.min(10),Validators.max(30),Validators.pattern(/^\d+$/)]],
    rowHeight:[0.55,[Validators.required,Validators.min(0.4),Validators.max(1.2)]],headerColor:['#e8eef7',Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    headerText:['',Validators.maxLength(300)],terms:['',Validators.maxLength(2000)],footerText:[DEFAULTS.footerText,Validators.maxLength(300)]});
  invoiceId=this.fb.control<number|null>(null,[Validators.required,Validators.min(1),Validators.pattern(/^\d+$/)]);
  checks=[{key:'showLogo',label:'لوگوی شعبه'},{key:'showSeller',label:'نام فروشنده'},{key:'showBuyer',label:'نام خریدار'},{key:'showContactDetails',label:'تلفن و نشانی'},
    {key:'showCode',label:'کد غذا / خدمت'},{key:'showUnit',label:'واحد'},{key:'showDiscount',label:'ستون تخفیف'},{key:'showTax',label:'مالیات'},
    {key:'showWords',label:'مبلغ به حروف'},{key:'showBalance',label:'پرداخت و مانده'},{key:'showNotes',label:'توضیحات سفارش'},{key:'showSignatures',label:'محل امضا'}];
  columns=[{key:'Row',label:'ردیف'},{key:'Code',label:'کد'},{key:'Description',label:'غذا / خدمت'},{key:'Quantity',label:'تعداد'},{key:'Unit',label:'واحد'},{key:'UnitPrice',label:'قیمت واحد'},{key:'Discount',label:'تخفیف'},{key:'Vat',label:'مالیات'},{key:'Total',label:'جمع ریال'}];
  get orderedColumns(){return this.form.controls.columnOrder.value.split(',').map(k=>this.columns.find(c=>c.key===k)!).filter(Boolean);}
  get visibleColumns(){const v=this.form.getRawValue();return this.orderedColumns.filter(c=>(c.key!=='Code'||v.showCode)&&(c.key!=='Unit'||v.showUnit)&&(c.key!=='Discount'||v.showDiscount)&&(c.key!=='Vat'||v.showTax));}
  get previewRows(){return Array.from({length:Math.min(30,Math.max(10,Math.trunc(this.form.controls.minimumRows.value || 10)))});}
  sample(key:string,index=0){return ({Row:['۱','۲','۳'][index],Code:['۱۰۱','۱۰۲','۲۰۱'][index],Description:['چلو جوجه','سالاد فصل','خدمات پذیرایی'][index],Quantity:['۸','۸','۱'][index],Unit:['پرس','عدد','خدمت'][index],UnitPrice:['۲۰۰٬۰۰۰','۲۵٬۰۰۰','۲۰۰٬۰۰۰'][index],Discount:'۰',Vat:'۰',Total:['۱٬۶۰۰٬۰۰۰','۲۰۰٬۰۰۰','۲۰۰٬۰۰۰'][index]} as Record<string,string>)[key];}
  moveColumn(i:number,delta:number){const a=this.orderedColumns.map(c=>c.key);[a[i],a[i+delta]]=[a[i+delta],a[i]];this.form.controls.columnOrder.setValue(a.join(','));}
  ngOnInit(){const q=this.route.snapshot.queryParamMap;this.invoiceId.setValue(q.get('invoiceId')?Number(q.get('invoiceId')):null);this.load(this.formats.find(f=>f.value===q.get('format'))?.value??'a4-portrait');}
  load(format:InvoicePrintFormat){this.format=format;this.loaded=false;this.busy=true;this.error=false;this.service.get(format).subscribe({next:r=>{this.form.reset({...DEFAULTS,...r.layout});this.version=r.version;this.busy=false;this.loaded=true;},error:()=>{this.busy=false;this.error=true;}});}
  reset(){this.form.reset(DEFAULTS);}
  save(){if(this.busy||this.form.invalid)return;this.busy=true;this.service.save({...this.form.getRawValue(),format:this.format},this.version).subscribe({next:r=>{this.version=r.version;this.busy=false;this.snack.open('قالب ذخیره شد.','بستن',{duration:3000});},error:()=>this.busy=false});}
  preview(){if(this.form.valid&&this.invoiceId.valid&&this.invoiceId.value)this.print.open(this.invoiceId.value,this.format,{...this.form.getRawValue(),format:this.format});}
  exportLayout(){const url=URL.createObjectURL(new Blob([JSON.stringify({...this.form.getRawValue(),format:this.format},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`catering-${this.format}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async importLayout(event:Event){const input=event.target as HTMLInputElement;const f=input.files?.[0];if(!f)return;try{if(f.size>20000)throw Error();const value=JSON.parse(await f.text());
    for(const [key,def] of Object.entries(DEFAULTS))if(key in value&&typeof value[key]!==typeof def)throw Error();
    const keys=String(value.columnOrder??DEFAULTS.columnOrder).split(',');if(keys.length!==9||new Set(keys).size!==9||keys.some(k=>!this.columns.some(c=>c.key===k)))throw Error();
    if(!['right','left','center'].includes(value.logoPosition??'right')||!['summary-first','terms-first'].includes(value.footerOrder??'summary-first'))throw Error();
    this.form.reset(DEFAULTS);for(const key of Object.keys(DEFAULTS))if(key in value)this.form.get(key)?.setValue(value[key]);
    this.snack.open('طرح بارگذاری شد؛ پیش‌نمایش را ببینید و ذخیره کنید.','بستن',{duration:4000});
  }catch{this.snack.open('فایل طرح معتبر نیست.','بستن',{duration:4000});}input.value='';}
}
