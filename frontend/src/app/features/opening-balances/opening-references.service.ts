import { Injectable,inject } from '@angular/core';
import { EMPTY,Observable,defer,expand,reduce } from 'rxjs';
import { ContactsService } from '../../core/services/contacts.service';
import { ItemsService } from '../../core/services/items.service';
import { WarehousesService } from '../../core/services/warehouses.service';
import { OpeningReference } from '../../core/models/opening-balance.models';
@Injectable({providedIn:'root'})
export class OpeningReferencesService {
  private contacts=inject(ContactsService);private items=inject(ItemsService);private warehouses=inject(WarehousesService);
  contactsList(){return this.all(page=>this.contacts.list({pageNumber:page,pageSize:100}));}
  itemsList(){return this.all(page=>this.items.list({pageNumber:page,pageSize:100}));}
  warehousesList(){return this.all(page=>this.warehouses.list({pageNumber:page,pageSize:100}));}
  private all(fetch:(page:number)=>Observable<{items:OpeningReference[];total:number}>):Observable<OpeningReference[]>{
    return defer(()=>{let page=1,count=0;return fetch(page).pipe(expand(result=>{count+=result.items.length;return result.items.length && count<result.total?fetch(++page):EMPTY;}),reduce((rows,result)=>rows.concat(result.items),[] as OpeningReference[]));});
  }
}
