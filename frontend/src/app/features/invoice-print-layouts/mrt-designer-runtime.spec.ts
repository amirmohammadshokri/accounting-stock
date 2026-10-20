// Real manufacturer SDK integration test in its isolated iframe, not a mocked designer.
describe('MRT designer browser runtime',()=>{
  it('opens the .NET A4/A5 templates, shows the full designer and emits an editable MRT save',async()=>{
    const frame=document.createElement('iframe');frame.sandbox.add('allow-scripts','allow-downloads','allow-modals');
    frame.style.cssText='width:1200px;height:800px;position:fixed;inset:0;z-index:9999';
    const channel=crypto.randomUUID();frame.src=`/report-designer/index.html#${channel}`;
    const pending:Array<{type:string;resolve:(value:Record<string,unknown>)=>void;reject:(error:Error)=>void}>=[];
    const receive=(event:MessageEvent)=>{
      if(event.source!==frame.contentWindow || event.data?.channel!==channel)return;
      if(event.data.type==='error'){for(const p of pending.splice(0))p.reject(new Error(String(event.data.message)));return;}
      const index=pending.findIndex(p=>p.type===event.data.type);if(index>=0)pending.splice(index,1)[0].resolve(event.data);
    };
    const wait=(type:string)=>new Promise<Record<string,unknown>>((resolve,reject)=>{const timer=window.setTimeout(()=>reject(new Error('Designer timed out waiting for '+type)),20000);pending.push({type,resolve:value=>{window.clearTimeout(timer);console.info('MRT runtime:',type);resolve(value);},reject:error=>{window.clearTimeout(timer);reject(error);}});});
    window.addEventListener('message',receive);
    try{
      const ready=wait('ready');document.body.appendChild(frame);await ready;
      const localization=await fetch('/report-designer/fa.xml').then(r=>r.text());
      const bytes=await fetch('/report-designer/Vazirmatn-Regular.ttf').then(r=>r.arrayBuffer());
      const font=btoa(Array.from(new Uint8Array(bytes),b=>String.fromCharCode(b)).join(''));
      for(const format of ['a4-portrait','a5-portrait']){
        const fixture=await fetch(`/test-fixtures/mrt/${format}.json`).then(r=>r.json());
        const loaded=wait('loaded');frame.contentWindow!.postMessage({channel,type:'load',...fixture,localization,font},'*');await loaded;
        const saved=wait('save');frame.contentWindow!.postMessage({channel,type:'save'},'*');
        const message=await saved;expect(typeof message['template']).toBe('string');
        const report=JSON.parse(String(message['template']));expect(Object.keys(report.Pages).length).toBeGreaterThan(0);
        frame.contentWindow!.postMessage({channel,type:'save-result',ok:true},'*');
      }
    }finally{window.removeEventListener('message',receive);frame.remove();}
  },120000);
});
