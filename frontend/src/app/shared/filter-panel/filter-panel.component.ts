import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';

@Component({standalone:true,selector:'app-filter-panel',imports:[MatButtonModule,...APP_ICON_IMPORTS],
  encapsulation:ViewEncapsulation.None,styleUrl:'./filter-panel.component.scss',
  template:`
    <section class="filter-panel" [class.filter-compact]="compact" role="search" [attr.aria-label]="title">
      <header class="filter-panel-heading"><span class="filter-panel-icon" aria-hidden="true"><mat-icon [svgIcon]="'tune'"></mat-icon></span><div><h2>{{title}}</h2>@if(hint){<p>{{hint}}</p>}</div></header>
      <div class="filter-fields" (keydown.enter)="onEnter($event)"><ng-content /></div>
      <footer class="filter-panel-footer"><div class="filter-primary-actions">
        @if(showApply){<button mat-flat-button type="button" [disabled]="applyDisabled" (click)="apply.emit()"><mat-icon [svgIcon]="'search'"></mat-icon>{{applyLabel}}</button>}
        @if(showReset){<button mat-stroked-button type="button" [disabled]="resetDisabled" (click)="reset.emit()"><mat-icon [svgIcon]="'filter_alt_off'"></mat-icon>پاک‌کردن فیلترها</button>}
      </div><div class="filter-extra-actions"><ng-content select="[filterExtraActions]" /></div></footer>
    </section>
  `
})
export class FilterPanelComponent {
  @Input() compact=false;
  @Input() title='جستجو و فیلتر';
  @Input() hint='گزینه‌های موردنظر را انتخاب کنید و «اعمال فیلتر» را بزنید.';
  @Input() applyLabel='اعمال فیلتر';
  @Input() showApply=true;
  @Input() showReset=true;
  @Input() applyDisabled=false;
  @Input() resetDisabled=false;
  @Output() apply=new EventEmitter<void>();
  @Output() reset=new EventEmitter<void>();
  onEnter(event:Event):void {
    const keyboard=event as KeyboardEvent;
    const target=event.target;
    if(!this.showApply||this.applyDisabled||event.defaultPrevented||keyboard.isComposing||
      !(target instanceof HTMLInputElement)||target.getAttribute('aria-expanded')==='true'||
      ['checkbox','radio','button','submit','file','color'].includes(target.type))return;
    event.preventDefault();this.apply.emit();
  }
}
