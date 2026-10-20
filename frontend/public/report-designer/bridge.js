/* Trusted local SDK, isolated in an opaque-origin iframe. No tokens, cookies or server connections. */
'use strict';
const channel=location.hash.slice(1);
const parentOrigin=document.referrer ? new URL(document.referrer).origin : null;
let designer=null, pendingAction='save', pendingCallback=null, lastModified=false;
function send(type,extra={}){parent.postMessage({channel,type,...extra},parentOrigin || '*');}
function serialize(report){report.script='';return report.saveToJsonString();}
function currentAction(action){if(!designer)return;pendingAction=action;designer.jsObject.ActionSaveReport();}
function load(payload){
  if(!window.Stimulsoft)throw new Error('بارگذاری کتابخانه طراح ناموفق بود. صفحه را دوباره باز کنید.');
  if(payload.localization)Stimulsoft.Base.Localization.StiLocalization.setLocalization(payload.localization);
  if(payload.licenseKey)Stimulsoft.Base.StiLicense.key=payload.licenseKey;
  if(payload.font){
    const bytes=Uint8Array.from(atob(payload.font),c=>c.charCodeAt(0));
    const font=new FontFace('Vazirmatn',bytes);font.load().then(f=>document.fonts.add(f));
    Stimulsoft.Base.StiFontCollection.addFontBytes(bytes,'Vazirmatn');
  }
  const report=new Stimulsoft.Report.StiReport();report.load(JSON.parse(payload.template));
  report.script='';report.dictionary.databases.clear();
  const data=new Stimulsoft.System.Data.DataSet('InvoicePrint');data.readJson(payload.data);
  report.regData('InvoicePrint','InvoicePrint',data);
  if(!designer){
    const options=new Stimulsoft.Designer.StiDesignerOptions();
    options.appearance.fullScreenMode=true;options.appearance.showSaveDialog=false;options.appearance.showReportIsNotSavedMessage=false;
    options.toolbar.showFileMenuNew=false;options.toolbar.showFileMenuOpen=false;
    options.toolbar.showFileMenuSaveAs=false;options.toolbar.showFileMenuExit=false;options.toolbar.showFileMenuClose=false;
    options.toolbar.showPublishButton=false;options.toolbar.showAboutButton=false;
    options.toolbar.showFileMenuAbout=false;options.toolbar.showFileMenuInfo=false;
    options.toolbar.showNewDashboardButton=false;
    options.dictionary.dataConnectionsPermissions=Stimulsoft.Designer.StiDesignerPermissions.None;
    options.dictionary.dataSourcesPermissions=Stimulsoft.Designer.StiDesignerPermissions.View;
    options.dictionary.businessObjectsPermissions=Stimulsoft.Designer.StiDesignerPermissions.None;
    designer=new Stimulsoft.Designer.StiDesigner(options,'InvoiceDesigner',false);
    designer.onSaveReport=(args,callback)=>{
      args.preventDefault=true;args.async=true;
      const action=pendingAction;pendingAction='save';
      if(action==='save')pendingCallback=callback;
      send(action,{template:serialize(args.report)});
    };
    designer.onSaveAsReport=designer.onSaveReport;
    designer.onPreviewReport=(args)=>{args.report.dictionary.databases.clear();};
    designer.report=report;designer.renderHtml('designer');
    document.getElementById('status').hidden=true;
    setInterval(()=>{
      const modified=!!designer.jsObject?.options?.reportIsModified;
      if(modified!==lastModified){lastModified=modified;send('modified',{modified});}
    },400);
  }else designer.report=report;
  lastModified=false;send('loaded');
}
window.addEventListener('message',event=>{
  if(event.source!==parent || (parentOrigin && event.origin!==parentOrigin) || event.data?.channel!==channel)return;
  const message=event.data;
  try{
    if(message.type==='load')load(message);
    else if(message.type==='save' || message.type==='preview' || message.type==='download')currentAction(message.type);
    else if(message.type==='save-result'){
      pendingCallback?.();
      lastModified=!message.ok;
      if(!message.ok && designer?.jsObject?.options)designer.jsObject.options.reportIsModified=true;
      send('modified',{modified:!message.ok});
      pendingCallback=null;
    }
  }catch(error){send('error',{message:error instanceof Error?error.message:'اجرای طراح ممکن نیست.'});}
});
window.addEventListener('error',()=>send('error',{message:'بارگذاری یا اجرای طراح ناموفق بود؛ صفحه را دوباره باز کنید.'}));
async function initialize(){
  try{
    // Load in dependency order and identify missing assets instead of announcing readiness too early.
    for(const [name,available] of [
      ['reports',()=>!!window.Stimulsoft?.Report?.StiReport],
      ['viewer',()=>!!window.Stimulsoft?.Viewer?.StiViewer],
      ['designer',()=>!!window.Stimulsoft?.Designer?.StiDesigner]
    ]){
      const path=new URL(`../vendor/stimulsoft/2024.3.2/stimulsoft.${name}.pack.js`,location.href);
      await new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src=path.href;script.async=false;
        const timer=setTimeout(()=>reject(new Error(`دریافت کتابخانه ${name} طول کشید. اتصال را بررسی و دوباره تلاش کنید.`)),45000);
        script.onload=()=>{clearTimeout(timer);resolve();};
        script.onerror=()=>{clearTimeout(timer);reject(new Error(`فایل کتابخانه طراح در دسترس نیست: ${path.pathname}. سرور فرانت را پس از نصب وابستگی‌ها دوباره اجرا کنید.`));};
        document.head.appendChild(script);
      });
      if(!available())throw new Error(`فایل stimulsoft.${name}.pack.js صحیح بارگذاری نشد. مسیر vendor/stimulsoft/2024.3.2 را در سرور فرانت بررسی کنید.`);
    }
    send('ready');
  }catch(error){
    const message=error instanceof Error?error.message:'آماده‌سازی کتابخانه طراح ممکن نیست.';
    document.getElementById('status').textContent=message;send('error',{message});
  }
}
void initialize();
