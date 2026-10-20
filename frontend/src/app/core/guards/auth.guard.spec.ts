import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, UrlTree } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

class AuthServiceStub {
  private authed = false;
  private admin = false;

  setState(authed: boolean, admin = false): void {
    this.authed = authed;
    this.admin = admin;
  }

  isAuthenticated(): boolean {
    return this.authed;
  }

  isAdmin(): boolean {
    return this.admin;
  }
}

describe('auth guards', () => {
  let authStub: AuthServiceStub;
  let router: Router;

  const fakeRoute = {} as any;
  const fakeState = { url: '/protected' } as any;

  beforeEach(() => {
    authStub = new AuthServiceStub();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }]
    });
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('allows navigation when authenticated', () => {
      authStub.setState(true);
      const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
      expect(result).toBeTrue();
    });

    it('redirects to /login with returnUrl when not authenticated', () => {
      authStub.setState(false);
      const navigateSpy = spyOn(router, 'navigate');
      const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/protected' } });
    });
  });

  describe('guestGuard', () => {
    it('allows navigation when NOT authenticated', () => {
      authStub.setState(false);
      const result = TestBed.runInInjectionContext(() => guestGuard(fakeRoute, fakeState));
      expect(result).toBeTrue();
    });

    it('redirects to / when already authenticated', () => {
      authStub.setState(true);
      const navigateSpy = spyOn(router, 'navigate');
      const result = TestBed.runInInjectionContext(() => guestGuard(fakeRoute, fakeState));
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });

  describe('adminGuard', () => {
    it('allows navigation for an authenticated admin', () => {
      authStub.setState(true, true);
      const result = TestBed.runInInjectionContext(() => adminGuard(fakeRoute, fakeState));
      expect(result).toBeTrue();
    });

    it('redirects to /login when not authenticated', () => {
      authStub.setState(false, false);
      const navigateSpy = spyOn(router, 'navigate');
      const result = TestBed.runInInjectionContext(() => adminGuard(fakeRoute, fakeState));
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/protected' } });
    });

    it('redirects to / when authenticated but not admin', () => {
      authStub.setState(true, false);
      const navigateSpy = spyOn(router, 'navigate');
      const result = TestBed.runInInjectionContext(() => adminGuard(fakeRoute, fakeState));
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });
});
