import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from './auth.service';
import { NavigationMenuService } from './navigation-menu.service';

describe('NavigationMenuService permissions', () => {
  const currentUser = signal({ permissions: [] as string[] });
  beforeEach(() => {
    currentUser.set({ permissions: [] });
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { currentUser, isAdmin: () => false } }
    ] });
  });

  it('shows only assigned business pages and shared appearance settings', () => {
    currentUser.set({ permissions: ['Invoice.Read'] });
    const menu = TestBed.inject(NavigationMenuService);
    expect(menu.shortcutItems().map(item => item.path)).toEqual(['/invoices', '/appearance']);
  });

  it('grants role management by permission and reacts to revocation', () => {
    currentUser.set({ permissions: ['Role.Read'] });
    const menu = TestBed.inject(NavigationMenuService);
    expect(menu.shortcutItems().some(item => item.path === '/roles')).toBeTrue();
    currentUser.set({ permissions: ['User.Read'] });
    expect(menu.shortcutItems().some(item => item.path === '/roles')).toBeFalse();
    expect(menu.shortcutItems().some(item => item.path === '/users')).toBeTrue();
  });
});
