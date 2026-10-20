import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, UrlTree } from '@angular/router';
import { permissionGuard, firstAccessibleRoute, NAV_PERMISSIONS } from './permission.guard';
import { PermissionService } from '../services/permission.service';

class PermissionServiceStub {
  private granted = new Set<string>();

  grant(...permissions: string[]): void {
    this.granted = new Set(permissions);
  }

  has(permission: string): boolean {
    return this.granted.has(permission);
  }
}

describe('permissionGuard', () => {
  let permStub: PermissionServiceStub;
  let router: Router;

  beforeEach(() => {
    permStub = new PermissionServiceStub();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: PermissionService, useValue: permStub }]
    });
    router = TestBed.inject(Router);
  });

  it('allows navigation when the user has the required permission', () => {
    permStub.grant('Invoice.Read');
    const guard = permissionGuard('Invoice.Read');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('redirects to the first accessible route when the permission is missing', () => {
    permStub.grant('Stock.Read');
    const guard = permissionGuard('Invoice.Read');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/stocks');
  });

  it('redirects to /login when the user has no matching permission at all', () => {
    permStub.grant();
    const guard = permissionGuard('Invoice.Read');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect((result as UrlTree).toString()).toBe('/login');
  });
});

describe('firstAccessibleRoute', () => {
  let permStub: PermissionServiceStub;

  beforeEach(() => {
    permStub = new PermissionServiceStub();
  });

  it('returns the first NAV_PERMISSIONS entry the user has access to, in declared order', () => {
    permStub.grant('Report.StockStatus', 'Order.Read', 'Item.Read');
    expect(firstAccessibleRoute(permStub as unknown as PermissionService)).toBe('/orders');
  });

  it('returns /login when the user has none of the nav permissions', () => {
    permStub.grant('SomeUnrelated.Permission');
    expect(firstAccessibleRoute(permStub as unknown as PermissionService)).toBe('/login');
  });

  it('respects Dashboard being first when the user has it', () => {
    permStub.grant('Report.Dashboard', 'Item.Read');
    expect(firstAccessibleRoute(permStub as unknown as PermissionService)).toBe('/dashboard');
  });

  it('covers every NAV_PERMISSIONS entry with a non-empty path/permission pair', () => {
    for (const entry of NAV_PERMISSIONS) {
      expect(entry.path.startsWith('/')).toBeTrue();
      expect(entry.permission.length).toBeGreaterThan(0);
    }
  });
});
