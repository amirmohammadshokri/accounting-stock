import { Injectable, computed, inject } from '@angular/core';
import { NAV_GROUPS, NavItem, NavGroup } from '../navigation-menu';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';

@Injectable({providedIn:'root'})
export class NavigationMenuService {
  private auth=inject(AuthService);
  private permissions=inject(PermissionService);
  readonly groups=computed(()=>NAV_GROUPS.map(group=>({...group,items:group.items.filter(item=>this.canAccess(item))})).filter(group=>group.items.length));
  readonly shortcutGroups=computed<Pick<NavGroup,'id'|'title'|'items'>[]>(()=>[
    {id:'actions',title:'ثبت سریع',items:[
      {path:'/orders/new',label:'سفارش جدید',icon:'add_shopping_cart',permission:'Order.Create'},
      {path:'/invoices/new',label:'فاکتور جدید',icon:'post_add',permission:'Invoice.Create'}
    ].filter(item=>this.canAccess(item))},
    ...this.groups()
  ].filter(group=>group.items.length));
  readonly shortcutItems=computed<NavItem[]>(()=>this.shortcutGroups().flatMap(group=>group.items));
  private canAccess(item:NavItem):boolean {
    if(item.admin&&!this.auth.isAdmin())return false;
    if(item.permission&&!this.permissions.has(item.permission))return false;
    if(item.anyOf&&!this.permissions.hasAny(item.anyOf))return false;
    if(item.allOf&&!this.permissions.hasAll(item.allOf))return false;
    return true;
  }
}
