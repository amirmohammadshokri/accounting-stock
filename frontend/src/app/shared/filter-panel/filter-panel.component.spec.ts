import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilterPanelComponent } from './filter-panel.component';

@Component({standalone:true,imports:[FilterPanelComponent],template:`
  <app-filter-panel [showApply]="manual" [applyDisabled]="busy" [resetDisabled]="busy" (apply)="applied=applied+1" (reset)="cleared=cleared+1">
    <input aria-label="نام" [attr.aria-expanded]="open" />
    <button filterExtraActions type="button">خروجی اکسل</button>
  </app-filter-panel>`})
class Host {manual=true;busy=false;open=false;applied=0;cleared=0;}

describe('Shared filters',()=>{
  beforeEach(async()=>{await TestBed.configureTestingModule({imports:[Host]}).compileComponents();});
  it('applies with Enter and clears through a separate action while keeping export outside the fields',()=>{
    const fixture=TestBed.createComponent(Host);fixture.detectChanges();const root=fixture.nativeElement as HTMLElement;
    const input=root.querySelector('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    expect(fixture.componentInstance.applied).toBe(1);
    const reset=Array.from(root.querySelectorAll('button')).find(button=>button.textContent?.includes('پاک‌کردن'))!;
    reset.click();expect(fixture.componentInstance.cleared).toBe(1);
    expect(root.querySelector('.filter-fields button')).toBeNull();
    expect(root.querySelector('.filter-extra-actions button')?.textContent).toContain('خروجی اکسل');
  });
  it('does not apply when Enter selects an autocomplete result or filters are loading',()=>{
    const fixture=TestBed.createComponent(Host);fixture.componentInstance.open=true;fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;const input=root.querySelector('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    expect(fixture.componentInstance.applied).toBe(0);
    fixture.componentInstance.open=false;fixture.componentInstance.busy=true;fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    const reset=Array.from(root.querySelectorAll('button')).find(button=>button.textContent?.includes('پاک‌کردن'))!;
    expect(reset.disabled).toBeTrue();reset.click();expect(fixture.componentInstance.cleared).toBe(0);
    expect(fixture.componentInstance.applied).toBe(0);
  });
  it('supports live filtering without adding a second manual request on Enter',()=>{
    const fixture=TestBed.createComponent(Host);fixture.componentInstance.manual=false;fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    root.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    expect(fixture.componentInstance.applied).toBe(0);
    expect(root.querySelector('.filter-primary-actions')?.textContent).not.toContain('اعمال فیلتر');
  });
});
