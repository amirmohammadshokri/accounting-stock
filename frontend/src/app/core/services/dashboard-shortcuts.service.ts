import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { NavItem } from '../navigation-menu';
import { NavigationMenuService } from './navigation-menu.service';

const DEFAULT_PATHS=['/orders/new','/invoices/new','/contacts','/payments','/reports/contact-statement'];
@Injectable({providedIn:'root'})
export class DashboardShortcutsService {
  private document=inject(DOCUMENT);
  private auth=inject(AuthService);
  readonly menu=inject(NavigationMenuService);
  private paths=signal<string[]|null>(null);
  readonly selected=computed<NavItem[]>(()=>{
    const items=this.menu.shortcutItems();
    return (this.paths()??DEFAULT_PATHS).map(path=>items.find(item=>item.path===path)).filter((item):item is NavItem=>item!==undefined);
  });
  readonly storageAvailable=signal(true);
  constructor(){
    effect(()=>{
      const key=this.key();
      try{
        const saved:unknown=JSON.parse(this.document.defaultView?.localStorage.getItem(key)??'null');
        this.paths.set(Array.isArray(saved)&&saved.every(path=>typeof path==='string')?[...new Set(saved)]:null);
        this.storageAvailable.set(true);
      }catch{this.paths.set(null);this.storageAvailable.set(false);}
    });
  }
  save(paths:readonly string[]):void {
    const allowed=new Set(this.menu.shortcutItems().map(item=>item.path));
    const next=[...new Set(paths)].filter(path=>allowed.has(path));
    this.paths.set(next);
    try{this.document.defaultView?.localStorage.setItem(this.key(),JSON.stringify(next));this.storageAvailable.set(true);}
    catch{this.storageAvailable.set(false);}
  }
  private key():string{return `accounting.shortcuts.${this.auth.currentUser()?.id??'guest'}`;}
}
