import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';
import { CurrentUser } from '../models/auth.models';

function userWith(permissions: string[]): CurrentUser {
  return {
    id: 1,
    email: 'a@b.com',
    firstName: 'A',
    lastName: 'B',
    role: 'SatisTemsilcisi',
    permissions,
    isHeadquarters: false
  };
}

describe('PermissionService', () => {
  let service: PermissionService;
  let currentUser: CurrentUser | null;

  beforeEach(() => {
    currentUser = null;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { currentUser: () => currentUser }
        }
      ]
    });
    service = TestBed.inject(PermissionService);
  });

  describe('has()', () => {
    it('returns false when there is no current user', () => {
      expect(service.has('Invoice.Read')).toBeFalse();
    });

    it('returns true when the permission is present', () => {
      currentUser = userWith(['Invoice.Read', 'Invoice.Create']);
      expect(service.has('Invoice.Read')).toBeTrue();
    });

    it('returns false when the permission is absent', () => {
      currentUser = userWith(['Invoice.Read']);
      expect(service.has('Invoice.Delete')).toBeFalse();
    });
  });

  describe('hasAny()', () => {
    it('returns true when the user has at least one of the requested permissions', () => {
      currentUser = userWith(['Order.Read']);
      expect(service.hasAny(['Invoice.Read', 'Order.Read'])).toBeTrue();
    });

    it('returns false when the user has none of the requested permissions', () => {
      currentUser = userWith(['Stock.Read']);
      expect(service.hasAny(['Invoice.Read', 'Order.Read'])).toBeFalse();
    });

    it('returns true for an empty permission list (vacuously satisfied)', () => {
      currentUser = null;
      expect(service.hasAny([])).toBeTrue();
    });
  });

  describe('hasAll()', () => {
    it('returns true only when every requested permission is present', () => {
      currentUser = userWith(['Invoice.Read', 'Invoice.Create', 'Invoice.Update']);
      expect(service.hasAll(['Invoice.Read', 'Invoice.Create'])).toBeTrue();
    });

    it('returns false when at least one requested permission is missing', () => {
      currentUser = userWith(['Invoice.Read']);
      expect(service.hasAll(['Invoice.Read', 'Invoice.Create'])).toBeFalse();
    });

    it('returns true for an empty permission list (vacuously satisfied)', () => {
      currentUser = null;
      expect(service.hasAll([])).toBeTrue();
    });
  });
});
