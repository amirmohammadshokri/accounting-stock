/* The SDK expects browser storage. Keep it private and ephemeral inside the opaque sandbox. */
'use strict';
function ephemeralStorage(){
  const values=new Map();
  const storage={getItem:key=>values.get(String(key)) ?? null,setItem:(key,value)=>values.set(String(key),String(value)),removeItem:key=>values.delete(String(key)),clear:()=>values.clear(),key:index=>Array.from(values.keys())[index] ?? null};
  Object.defineProperty(storage,'length',{get:()=>values.size});
  return new Proxy(storage,{get:(target,key)=>key in target?target[key]:values.get(String(key)),set:(_,key,value)=>{values.set(String(key),String(value));return true;}});
}
Object.defineProperty(window,'localStorage',{value:ephemeralStorage(),configurable:true});
Object.defineProperty(window,'sessionStorage',{value:ephemeralStorage(),configurable:true});
const cookies=new Map();
Object.defineProperty(document,'cookie',{configurable:true,get:()=>Array.from(cookies,([key,value])=>key+'='+value).join('; '),set:value=>{const pair=String(value).split(';')[0];const index=pair.indexOf('=');if(index>=0)cookies.set(pair.slice(0,index).trim(),pair.slice(index+1));}});
