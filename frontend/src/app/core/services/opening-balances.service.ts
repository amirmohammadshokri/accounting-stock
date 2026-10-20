import { Injectable,inject } from '@angular/core';
import { HttpClient,HttpParams,HttpContext } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HANDLE_ERROR_LOCALLY } from '../interceptors/http-problem-interceptor';
import { OpeningBalance,OpeningBody,OpeningFilters,OpeningKind } from '../models/opening-balance.models';
import { parseOpeningJson } from '../utils/opening-balance.utils';
@Injectable({providedIn:'root'})
export class OpeningBalancesService {
  private http=inject(HttpClient);private base=environment.apiBaseUrl+'/opening-balances';
  private context(){return new HttpContext().set(HANDLE_ERROR_LOCALLY,true);}
  list(kind:OpeningKind,filters:OpeningFilters={}){
    let params=new HttpParams();const keys=kind==='contacts'?['contactId'] as const:['warehouseId','itemId'] as const;
    for(const key of keys)if(filters[key]!=null)params=params.set(key,String(filters[key]));
    return this.http.get(`${this.base}/${kind}`,{params,responseType:'text',context:this.context()}).pipe(map(text=>parseOpeningJson(text) as OpeningBalance[]));
  }
  save(kind:OpeningKind,body:OpeningBody,id?:number){
    const options={responseType:'text' as const,context:this.context()};
    return (id?this.http.put(`${this.base}/${kind}/${id}`,body,options):this.http.post(`${this.base}/${kind}`,body,options)).pipe(map(text=>parseOpeningJson(text) as OpeningBalance));
  }
  delete(kind:OpeningKind,row:OpeningBalance){return this.http.delete<void>(`${this.base}/${kind}/${row.id}`,{params:new HttpParams().set('rowVersionBase64',row.rowVersionBase64),context:this.context()});}
}
