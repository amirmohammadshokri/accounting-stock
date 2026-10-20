import { NavigationMenuService } from '../services/navigation-menu.service';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_ICON_IMPORTS } from './app-svg-icon.directive';
import { APP_ICONS } from './app-icons';
import { NAV_GROUPS } from '../navigation-menu';

@Component({standalone:true,imports:[...APP_ICON_IMPORTS],template:`<mat-icon class="fixed" [svgIcon]="'tune'"></mat-icon>@for(name of names;track name){<mat-icon [svgIcon]="name"></mat-icon>}`})
class IconGallery {readonly names=Object.keys(APP_ICONS);}

describe('Local SVG icons',()=>{
  it('renders the full catalog as SVG without font ligature text or network assets',()=>{
    const fixture=TestBed.createComponent(IconGallery);fixture.detectChanges();
    const nodes=fixture.nativeElement.querySelectorAll('mat-icon:not(.fixed)') as NodeListOf<HTMLElement>;
    expect(fixture.nativeElement.querySelector('.fixed svg path')).not.toBeNull();
    expect(nodes.length).toBe(Object.keys(APP_ICONS).length);
    for(const node of nodes){expect(node.querySelector('svg path')).not.toBeNull();expect(node.textContent?.trim()).toBe('');expect(node.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 512 512');}
  });
  it('covers every navigation group and item, including configurable shortcut targets',()=>{
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{isAdmin:()=>true}},{provide:PermissionService,useValue:{has:()=>true,hasAny:()=>true,hasAll:()=>true}}]});
    for(const item of TestBed.inject(NavigationMenuService).shortcutItems())expect(APP_ICONS[item.icon]).toBeTruthy();
    for(const group of NAV_GROUPS){expect(APP_ICONS[group.icon]).toBeTruthy();for(const item of group.items)expect(APP_ICONS[item.icon]).toBeTruthy();}
    for(const name of ['expand_more','expand_less','visibility','visibility_off'])expect(APP_ICONS[name]).toBeTruthy();
  });
});
