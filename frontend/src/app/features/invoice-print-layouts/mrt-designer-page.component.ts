import { AfterViewInit, Component, DestroyRef, ElementRef, NgZone, ViewChild, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HANDLE_ERROR_LOCALLY } from '../../core/interceptors/http-problem-interceptor';
import { INVOICE_PRINT_FORMATS, InvoicePrintFormat } from '../../core/models/invoice-print-layout.models';
import { environment } from '../../../environments/environment';

export interface MrtEditorDocument {template:string;version:string;isCustom:boolean;data:Record<string,unknown[]>;designerLicenseKey?:string|null;}
interface BridgeMessage {channel:string;type:string;template?:string;message?:string;modified?:boolean;}

@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,MatFormFieldModule,MatInputModule,MatSelectModule,...APP_ICON_IMPORTS],
  template:`
    <header class="page-heading"><div><h1>طراح کامل قالب فاکتور</h1><p>اجزای قالب را بکشید، اندازه و ظاهرشان را تغییر دهید و برای چاپ ذخیره کنید.</p></div><a mat-stroked-button routerLink="/invoice-print-layouts">تنظیمات ساده چاپ</a></header>
    <section class="designer-toolbar">
      <mat-form-field appearance="outline"><mat-label>اندازه قالب</mat-label><mat-select [value]="format()" (selectionChange)="changeFormat($event.value,$event.source)" [disabled]="busy()">@for(item of formats;track item.value){<mat-option [value]="item.value">{{item.label}}</mat-option>}</mat-select></mat-form-field>
      <button mat-flat-button type="button" (click)="command('save')" [disabled]="!loaded() || busy()"><mat-icon [svgIcon]="'save'"></mat-icon>ذخیره و استفاده در چاپ</button>
      <button mat-stroked-button type="button" (click)="command('download')" [disabled]="!loaded() || busy()"><mat-icon [svgIcon]="'download'"></mat-icon>دریافت MRT</button>
      <button mat-stroked-button type="button" (click)="file.click()" [disabled]="!loaded() || busy()"><mat-icon [svgIcon]="'attach_file'"></mat-icon>بارگذاری MRT</button><input #file type="file" accept=".mrt,application/json" hidden (change)="importFile($event)">
      <button mat-button type="button" (click)="restore()" [disabled]="!document()?.isCustom || busy()">بازگشت به قالب فعلی ساده</button>
    </section>
    <section class="preview-controls"><mat-form-field appearance="outline"><mat-label>شناسه فاکتور برای آزمایش</mat-label><input matInput type="number" min="1" [(ngModel)]="invoiceId" [disabled]="busy()"></mat-form-field><button mat-stroked-button type="button" (click)="reloadData()" [disabled]="!validInvoice() || busy()">نمایش داده همین فاکتور در طراح</button><button mat-stroked-button type="button" (click)="command('preview')" [disabled]="!loaded() || busy()"><mat-icon [svgIcon]="'print'"></mat-icon>پیش‌نمایش PDF با تغییرات فعلی</button><button mat-button type="button" (click)="loadSample()" [disabled]="busy()">داده نمونه فارسی</button></section>
    <p class="hint">فیلدهای Invoice مشخصات و مبالغ فاکتور، Lines ردیف‌ها و Invoice.LogoBytes لوگوی همان شعبه هستند. قالب هر اندازه جدا ذخیره می‌شود؛ تغییرات ذخیره‌شده در چاپ و PDF همه شعب استفاده می‌شود. بدون شناسه فاکتور هم می‌توانید PDF نمونه را ببینید.</p>
    @if(document() && !document()?.designerLicenseKey){<p class="license-hint">مجوز طراح وب تنظیم نشده است؛ طراح در حالت آزمایشی Stimulsoft باز می‌شود. پیش‌نمایش PDF نهایی با موتور چاپ سرور انجام می‌شود.</p>}
    @if(message()){<p role="status" class="message">{{message()}}</p>}
    @if(error()){<p role="alert" class="form-error">{{error()}} <button mat-button type="button" (click)="reloadData()" [disabled]="busy()">بارگذاری دوباره</button></p>}
    <div class="designer-shell" [attr.aria-busy]="busy()">@if(busy()){<div class="loading-cover" role="status">در حال آماده‌سازی…</div>}<iframe #frame title="طراح MRT فاکتور" [src]="frameUrl" sandbox="allow-scripts allow-downloads allow-modals" referrerpolicy="strict-origin" [attr.inert]="busy()?'':null"></iframe></div>
  `,styleUrl:'./mrt-designer-page.component.scss'})
export class MrtDesignerPageComponent implements AfterViewInit {
  @ViewChild('frame') private frame?:ElementRef<HTMLIFrameElement>;
  private readonly http=inject(HttpClient);
  private readonly dialogs=inject(MatDialog);
  private readonly zone=inject(NgZone);
  private readonly destroy=inject(DestroyRef);
  private readonly route=inject(ActivatedRoute);
  private readonly base=`${environment.apiBaseUrl}/invoice-mrt`;
  private readonly channel=crypto.randomUUID();
  private readonly sanitizer=inject(DomSanitizer);
  frameUrl=this.sanitizer.bypassSecurityTrustResourceUrl(`report-designer/index.html#${this.channel}`);
  readonly formats=INVOICE_PRINT_FORMATS;
  readonly format=signal<InvoicePrintFormat>('a4-portrait');
  readonly document=signal<MrtEditorDocument|null>(null);
  readonly busy=signal(false);readonly loaded=signal(false);readonly dirty=signal(false);
  readonly error=signal('');readonly message=signal('');
  invoiceId:number|null=null;
  private frameReady=false;
  private previewWindow:Window|null=null;
  private assets?:Promise<{localization:string;font:string}>;
  private readonly receive=(event:MessageEvent)=>{
    // Sandboxed iframe has the opaque origin "null". Check its exact Window and per-instance nonce.
    if(event.source!==this.frame?.nativeElement.contentWindow || event.origin!=='null' || event.data?.channel!==this.channel)return;
    this.zone.run(()=>{void this.handle(event.data as BridgeMessage);});
  };
  constructor(){
    const requested=this.route.snapshot.queryParamMap.get('format');
    if(this.formats.some(item=>item.value===requested))this.format.set(requested as InvoicePrintFormat);
    const id=Number(this.route.snapshot.queryParamMap.get('invoiceId'));if(id>0 && Number.isInteger(id))this.invoiceId=id;
    window.addEventListener('message',this.receive);
    const beforeUnload=(event:BeforeUnloadEvent)=>{if(this.dirty()){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',beforeUnload);
    this.destroy.onDestroy(()=>{window.removeEventListener('message',this.receive);window.removeEventListener('beforeunload',beforeUnload);});
  }
  ngAfterViewInit():void{void this.load(this.validInvoice()?this.invoiceId:undefined);}
  validInvoice():boolean{return this.invoiceId!==null && Number.isInteger(this.invoiceId) && this.invoiceId>0;}
  private async confirm(message:string):Promise<boolean>{return !!await firstValueFrom(this.dialogs.open(ConfirmDialogComponent,{data:{title:'تأیید تغییر قالب',message,confirmLabel:'ادامه',cancelLabel:'انصراف'}}).afterClosed());}
  async canLeave():Promise<boolean>{return !this.dirty() || this.confirm('تغییرات قالب هنوز ذخیره نشده است. بدون ذخیره ادامه می‌دهید؟');}
  async changeFormat(format:InvoicePrintFormat,source?:{value:unknown}):Promise<void>{if(source)source.value=this.format();if(this.busy() || !(await this.canLeave()))return;this.format.set(format);await this.load();}
  async reloadData():Promise<void>{
    if(this.busy() || !(await this.canLeave()))return;
    if(!this.loaded()){
      this.frameReady=false;
      this.frameUrl=this.sanitizer.bypassSecurityTrustResourceUrl(`report-designer/index.html?retry=${crypto.randomUUID()}#${this.channel}`);
    }
    await this.load(this.validInvoice()?this.invoiceId:undefined);
  }
  async loadSample():Promise<void>{if(this.busy() || !(await this.canLeave()))return;await this.load();}
  private async load(id?:number|null):Promise<void>{
    this.busy.set(true);this.loaded.set(false);this.document.set(null);this.error.set('');this.message.set('');
    try{
      const result=await firstValueFrom(this.http.get<MrtEditorDocument>(`${this.base}/${this.format()}`,{params:id?{invoiceId:id}:{},context:this.context()}).pipe(takeUntilDestroyed(this.destroy)));
      this.document.set(result);this.dirty.set(false);if(this.frameReady)await this.populate();
    }catch(error){this.error.set(await this.errorText(error));this.busy.set(false);}
  }
  private async populate():Promise<void>{
    try{
      const assets=await (this.assets ??=Promise.all([fetch('report-designer/fa.xml').then(r=>{if(!r.ok)throw Error('فایل فارسی طراح در دسترس نیست.');return r.text();}),fetch('report-designer/Vazirmatn-Regular.ttf').then(r=>{if(!r.ok)throw Error('فونت طراح در دسترس نیست.');return r.arrayBuffer();})]).then(([localization,font])=>({localization,font:btoa(Array.from(new Uint8Array(font),byte=>String.fromCharCode(byte)).join(''))})));
      const value=this.document();if(!value)return;
      this.post({type:'load',template:value.template,data:value.data,localization:assets.localization,font:assets.font,licenseKey:value.designerLicenseKey});
    }catch(error){this.error.set(await this.errorText(error));this.busy.set(false);this.assets=undefined;}
  }
  command(type:'save'|'download'|'preview'):void{
    if(this.busy() || !this.loaded())return;
    if(type==='preview'){
      this.previewWindow=window.open('','_blank');
      if(!this.previewWindow){this.error.set('برای پیش‌نمایش PDF، اجازه بازشدن پنجره جدید را بدهید.');return;}
      this.previewWindow.opener=null;this.previewWindow.document.documentElement.dir='rtl';
      this.previewWindow.document.body.textContent='در حال آماده‌سازی نسخه چاپی فاکتور…';
    }
    this.post({type});
  }
  private post(message:Record<string,unknown>):void{this.frame?.nativeElement.contentWindow?.postMessage({...message,channel:this.channel},'*');}
  private async handle(message:BridgeMessage):Promise<void>{
    if(message.type==='ready'){this.frameReady=true;if(this.document())await this.populate();return;}
    if(message.type==='loaded'){this.loaded.set(true);this.busy.set(false);return;}
    if(message.type==='modified'){this.dirty.set(!!message.modified);return;}
    if(message.type==='error'){this.previewWindow?.close();this.previewWindow=null;this.error.set(message.message ?? 'اجرای طراح ناموفق بود.');this.busy.set(false);return;}
    if(!['save','preview','download'].includes(message.type) || typeof message.template!=='string' || message.template.length>2*1024*1024 || this.busy())return;
    if(message.type==='download'){this.download(new Blob([message.template],{type:'application/json'}),`Invoice-${this.format()}.mrt`);return;}
    this.busy.set(true);this.error.set('');this.message.set('');
    try{
      if(message.type==='save'){
        const saved=await firstValueFrom(this.http.put<{template:string;version:string}>(`${this.base}/${this.format()}`,{template:message.template,version:this.document()?.version},{context:this.context()}));
        this.document.update(old=>old?{...old,template:saved.template,version:saved.version,isCustom:true}:old);
        this.dirty.set(false);this.post({type:'save-result',ok:true});this.message.set('قالب ذخیره شد؛ چاپ و PDF این اندازه از همین قالب استفاده می‌کند.');
      }else{
        const blob=await firstValueFrom(this.http.post(`${this.base}/${this.format()}/preview${this.validInvoice()?'/'+this.invoiceId:''}`,{template:message.template},{responseType:'blob',context:this.context()}));
        if(blob.type.split(';')[0]!=='application/pdf')throw new Error('پاسخ سرویس PDF معتبر نیست.');
        const url=URL.createObjectURL(blob);
        if(this.previewWindow && !this.previewWindow.closed)this.previewWindow.location.replace(url);
        else this.download(blob,`Invoice-preview-${this.format()}.pdf`);
        this.previewWindow=null;window.setTimeout(()=>URL.revokeObjectURL(url),300000);
        this.message.set('نسخه PDF با تغییرات فعلی آماده شد.');
      }
    }catch(error){this.previewWindow?.close();this.previewWindow=null;this.error.set(await this.errorText(error));if(message.type==='save')this.post({type:'save-result',ok:false});}
    finally{this.busy.set(false);}
  }
  async restore():Promise<void>{
    if(this.busy() || !this.document()?.isCustom || !(await this.confirm('قالب MRT این اندازه کنار گذاشته شود و تنظیمات ساده فعلی در چاپ استفاده شود؟')))return;
    this.busy.set(true);
    try{await firstValueFrom(this.http.post(`${this.base}/${this.format()}/restore`,{version:this.document()?.version},{context:this.context()}));await this.load();}
    catch(error){this.error.set(await this.errorText(error));this.busy.set(false);}
  }
  async importFile(event:Event):Promise<void>{
    const input=event.target as HTMLInputElement;const file=input.files?.[0];input.value='';
    if(!file || this.busy() || !(await this.canLeave()))return;
    if(file.size>2*1024*1024){this.error.set('حجم قالب باید حداکثر ۲ مگابایت باشد.');return;}
    this.busy.set(true);this.error.set('');
    try{const validated=await firstValueFrom(this.http.post<{template:string}>(`${this.base}/${this.format()}/validate`,{template:await file.text()},{context:this.context()}));this.document.update(old=>old?{...old,template:validated.template}:old);await this.populate();this.dirty.set(true);this.message.set('قالب بارگذاری شد؛ برای استفاده در چاپ، آن را ذخیره کنید.');}
    catch(error){this.error.set(await this.errorText(error));this.busy.set(false);}
  }
  private context():HttpContext{return new HttpContext().set(HANDLE_ERROR_LOCALLY,true);}
  private download(blob:Blob,name:string):void{const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),60000);}
  private async errorText(error:unknown):Promise<string>{let value=error instanceof HttpErrorResponse?error.error:null;if(value instanceof Blob){try{value=JSON.parse(await value.text());}catch{value=null;}}return value?.detail ?? (error instanceof Error?error.message:'ارتباط با سرویس طراح برقرار نشد؛ دوباره تلاش کنید.');}
}
