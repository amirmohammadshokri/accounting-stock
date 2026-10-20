import { Component, computed, inject, signal } from '@angular/core';
import { NavItem } from '../../core/navigation-menu';
import { RouterLink } from '@angular/router';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DashboardShortcutsService } from '../../core/services/dashboard-shortcuts.service';

@Component({standalone:true,selector:'app-dashboard-shortcuts',
  imports:[RouterLink,...APP_ICON_IMPORTS,MatButtonModule,MatCheckboxModule],
  template:`
    <section class="quick-access" aria-labelledby="quick-access-title">
      <header><div><span class="eyebrow">میز کار شما</span><h2 id="quick-access-title">دسترسی سریع</h2><p>کارهای پرکاربردتان را همین‌جا قرار دهید.</p></div>
        <button mat-stroked-button type="button" (click)="beginEdit()" [disabled]="editing()" [attr.aria-expanded]="editing()" aria-controls="shortcut-editor"><mat-icon [svgIcon]="'tune'"></mat-icon>تنظیم میان‌برها</button>
      </header>
      @if(!editing()){
        <div class="shortcut-grid">@for(item of shortcuts.selected();track item.path){
          <a class="shortcut" [routerLink]="item.path"><span class="shortcut-icon"><mat-icon [svgIcon]="item.icon"></mat-icon></span><strong>{{item.label}}</strong><svg class="shortcut-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5m7 7-7-7 7-7" /></svg></a>
        }@empty{<p class="empty">هنوز میان‌بری انتخاب نکرده‌اید؛ از «تنظیم میان‌برها» شروع کنید.</p>}</div>
      }@else{
        <div id="shortcut-editor" class="editor">
          <div class="selection"><h3>انتخاب بخش‌ها</h3><p class="hint">تیک هر گزینه را بزنید تا به میز کارتان اضافه شود.</p>
            @for(group of shortcuts.menu.shortcutGroups();track group.id){<fieldset><legend>{{group.title}}</legend>
              @for(item of group.items;track item.path){<mat-checkbox [checked]="draft().includes(item.path)" (change)="toggle(item.path,$event.checked)">{{item.label}}</mat-checkbox>}
            </fieldset>}
          </div>
          <div class="order"><h3>ترتیب نمایش</h3><p class="hint">اولین گزینه، سمت راست نمایش داده می‌شود.</p>
            @for(item of draftItems();track item.path;let i=$index){<div class="order-row"><span>{{item.label}}</span><button mat-icon-button type="button" [disabled]="i===0" (click)="move(i,-1)" [attr.aria-label]="'جلو بردن '+item.label"><mat-icon [svgIcon]="'arrow_upward'"></mat-icon></button><button mat-icon-button type="button" [disabled]="i===draftItems().length-1" (click)="move(i,1)" [attr.aria-label]="'عقب بردن '+item.label"><mat-icon [svgIcon]="'arrow_downward'"></mat-icon></button><button mat-icon-button type="button" (click)="toggle(item.path,false)" [attr.aria-label]="'حذف میان‌بر '+item.label"><mat-icon [svgIcon]="'close'"></mat-icon></button></div>}
          </div>
          <footer><span class="hint">برای حساب شما در همین مرورگر ذخیره می‌شود.</span><button mat-button type="button" (click)="editing.set(false)">انصراف</button><button mat-flat-button type="button" (click)="save()">ذخیره میان‌برها</button></footer>
        </div>
      }
      @if(!shortcuts.storageAvailable()){<p role="status" class="hint">ذخیره مرورگر در دسترس نیست؛ انتخاب‌ها تا پایان این جلسه فعال‌اند.</p>}
    </section>
  `,
  styleUrl:'./dashboard-shortcuts.component.scss'
})
export class DashboardShortcutsComponent {
  readonly shortcuts=inject(DashboardShortcutsService);
  readonly editing=signal(false);
  readonly draft=signal<string[]>([]);
  readonly draftItems=computed<NavItem[]>(()=>this.draft().map(path=>this.shortcuts.menu.shortcutItems().find(item=>item.path===path)).filter((item):item is NavItem=>item!==undefined));
  beginEdit():void{this.draft.set(this.shortcuts.selected().map(item=>item.path));this.editing.set(true);}
  toggle(path:string,checked:boolean):void{this.draft.update(paths=>checked?[...new Set([...paths,path])]:paths.filter(value=>value!==path));}
  move(index:number,delta:number):void {
    const paths=this.draftItems().map(item=>item.path);const target=index+delta;
    if(target<0||target>=paths.length)return;
    [paths[index],paths[target]]=[paths[target],paths[index]];this.draft.set(paths);
  }
  save():void{this.shortcuts.save(this.draft());this.editing.set(false);}
}
