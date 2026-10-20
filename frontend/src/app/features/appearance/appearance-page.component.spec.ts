import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AppearancePageComponent } from './appearance-page.component';

describe('Workspace background controls',()=>{
  let originalStyle:string|null;
  let originalTheme:string|undefined;
  beforeEach(async()=>{
    originalStyle=document.documentElement.getAttribute('style');originalTheme=document.documentElement.dataset['theme'];
    localStorage.removeItem('accounting.appearance.994');
    await TestBed.configureTestingModule({imports:[AppearancePageComponent],providers:[
      {provide:AuthService,useValue:{currentUser:signal({id:994})}}
    ]}).compileComponents();
  });
  afterEach(()=>{
    localStorage.removeItem('accounting.appearance.994');
    if(originalStyle===null)document.documentElement.removeAttribute('style');else document.documentElement.setAttribute('style',originalStyle);
    if(originalTheme===undefined)delete document.documentElement.dataset['theme'];else document.documentElement.dataset['theme']=originalTheme;
  });
  it('applies and saves the chosen background without changing the button color',async()=>{
    const fixture=TestBed.createComponent(AppearancePageComponent);fixture.detectChanges();await fixture.whenStable();
    const root=fixture.nativeElement as HTMLElement;
    const originalAccent=fixture.componentInstance.appearance.preferences().color;
    Array.from(root.querySelectorAll('button')).find(button=>button.textContent?.includes('کرم گرم'))!.click();fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('mat-button-toggle[value="solid"] button')!.click();fixture.detectChanges();await fixture.whenStable();
    expect(fixture.componentInstance.appearance.preferences().color).toBe(originalAccent);
    expect(document.documentElement.style.getPropertyValue('--app-workspace')).toContain('#efdfc7');
    expect(document.documentElement.style.getPropertyValue('--app-workspace-image')).toBe('none');
    expect(JSON.parse(localStorage.getItem('accounting.appearance.994')!)).toEqual(jasmine.objectContaining({backgroundColor:'#efdfc7',backgroundStyle:'solid'}));
    expect(root.querySelector('input[aria-label="انتخاب رنگ پس‌زمینه"]')).not.toBeNull();
  });
});
