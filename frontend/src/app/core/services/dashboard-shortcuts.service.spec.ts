import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { DashboardShortcutsService } from './dashboard-shortcuts.service';

const first={id:991,role:'User',permissions:['Order.Read','Order.Create','Contact.Read','Report.Dashboard']};
describe('Personal dashboard shortcuts',()=>{
  const user=signal({...first});
  beforeEach(()=>{
    for(const id of [991,992])localStorage.removeItem(`accounting.shortcuts.${id}`);
    user.set({...first});
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{currentUser:user,isAdmin:computed(()=>user().role==='Admin')}}]});
  });
  afterEach(()=>{for(const id of [991,992])localStorage.removeItem(`accounting.shortcuts.${id}`);});
  it('limits defaults, editor choices and saved paths to authorized routes',()=>{
    const service=TestBed.inject(DashboardShortcutsService);TestBed.flushEffects();
    expect(service.selected().map(item=>item.path)).toEqual(['/orders/new','/contacts']);
    service.save(['/roles','https://example.com','/contacts','/contacts','/orders/new']);
    expect(service.selected().map(item=>item.path)).toEqual(['/contacts','/orders/new']);
    user.set({...first,permissions:['Order.Read']});TestBed.flushEffects();
    expect(service.selected()).toEqual([]);
    expect(service.menu.shortcutItems().map(item=>item.path)).not.toContain('/orders/new');
  });
  it('preserves ordering and an intentionally empty menu separately for each account',()=>{
    const service=TestBed.inject(DashboardShortcutsService);TestBed.flushEffects();
    service.save(['/contacts','/orders/new']);
    user.set({...first,id:992});TestBed.flushEffects();service.save([]);
    user.set({...first});TestBed.flushEffects();
    expect(service.selected().map(item=>item.path)).toEqual(['/contacts','/orders/new']);
    user.set({...first,id:992});TestBed.flushEffects();expect(service.selected()).toEqual([]);
  });
  it('ignores invalid persisted data and requires both permissions for the print designer',()=>{
    localStorage.setItem('accounting.shortcuts.991','{"path":"/roles"}');
    const service=TestBed.inject(DashboardShortcutsService);TestBed.flushEffects();
    expect(service.selected().length).toBeGreaterThan(0);
    user.set({...first,permissions:['CompanySettings.Read']});TestBed.flushEffects();
    expect(service.menu.shortcutItems().map(item=>item.path)).not.toContain('/invoice-print-layouts');
    user.set({...first,permissions:['CompanySettings.Read','CompanySettings.Update']});TestBed.flushEffects();
    expect(service.menu.shortcutItems().map(item=>item.path)).toContain('/invoice-print-layouts');
  });
});
