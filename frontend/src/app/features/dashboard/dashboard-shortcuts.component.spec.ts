import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { DashboardShortcutsComponent } from './dashboard-shortcuts.component';

describe('Dashboard shortcut editor',()=>{
  beforeEach(async()=>{
    localStorage.removeItem('accounting.shortcuts.993');
    await TestBed.configureTestingModule({imports:[DashboardShortcutsComponent],providers:[provideRouter([]),
      {provide:AuthService,useValue:{currentUser:signal({id:993,permissions:['Order.Create','Contact.Read']}),isAdmin:()=>false}}
    ]}).compileComponents();
  });
  afterEach(()=>localStorage.removeItem('accounting.shortcuts.993'));
  it('lets the user add and reorder shortcuts, cancel without saving, then save navigable links',()=>{
    const fixture=TestBed.createComponent(DashboardShortcutsComponent);fixture.detectChanges();
    const component=fixture.componentInstance;
    const root=fixture.nativeElement as HTMLElement;
    component.beginEdit();component.toggle('/appearance',true);component.move(2,-1);fixture.detectChanges();
    expect(root.querySelectorAll('fieldset').length).toBeGreaterThan(0);
    component.editing.set(false);fixture.detectChanges();
    expect(root.querySelector('a[href="/appearance"]')).toBeNull();
    component.beginEdit();component.toggle('/appearance',true);component.move(2,-1);component.save();fixture.detectChanges();
    expect(Array.from(root.querySelectorAll('a')).map(link=>link.getAttribute('href'))).toEqual(['/orders/new','/appearance','/contacts']);
    expect(JSON.parse(localStorage.getItem('accounting.shortcuts.993')!)).toEqual(['/orders/new','/appearance','/contacts']);
  });
});
