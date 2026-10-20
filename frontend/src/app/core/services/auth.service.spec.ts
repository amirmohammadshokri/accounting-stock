import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function fakeJwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(claims));
  return `${header}.${payload}.fakesignature`;
}

describe('AuthService', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('starts unauthenticated when localStorage is empty', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('login() stores the token/user and flips isAuthenticated/isAdmin', () => {
    const service = TestBed.inject(AuthService);

    service.login({ email: 'admin@demo.local', password: 'Admin123!' }).subscribe();

    const req = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@demo.local',
      accessToken: fakeJwt({
        id: '1',
        email: 'admin@demo.local',
        role: 'Admin',
        permission: ['Invoice.Read', 'Invoice.Create'],
        branchId: '1',
        isHeadquarters: 'true',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      })
    });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isAdmin()).toBeTrue();
    expect(service.currentUser()?.email).toBe('admin@demo.local');
    expect(service.currentUser()?.permissions).toEqual(['Invoice.Read', 'Invoice.Create']);
    expect(localStorage.getItem('accessToken')).toBeTruthy();
  });

  it('login() with a non-admin role leaves isAdmin false', () => {
    const service = TestBed.inject(AuthService);

    service.login({ email: 'depo@demo.local', password: 'Depo123!' }).subscribe();

    const req = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    req.flush({
      id: 2,
      firstName: 'Depo',
      lastName: 'Sorumlusu',
      email: 'depo@demo.local',
      accessToken: fakeJwt({
        id: '2',
        email: 'depo@demo.local',
        role: 'DepoSorumlusu',
        permission: ['Stock.Read'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      })
    });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
  });

  it('logout() clears storage, resets signals and navigates to /login', () => {
    const service = TestBed.inject(AuthService);
    const navigateSpy = spyOn(router, 'navigate');

    service.login({ email: 'admin@demo.local', password: 'Admin123!' }).subscribe();
    http.expectOne(`${environment.apiBaseUrl}/auth/login`).flush({
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@demo.local',
      accessToken: fakeJwt({
        id: '1',
        email: 'admin@demo.local',
        role: 'Admin',
        permission: [],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      })
    });
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('isTokenExpired() is true when there is no token', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isTokenExpired()).toBeTrue();
  });

  it('isTokenExpired() is true for a token whose exp is in the past', () => {
    localStorage.setItem(
      'accessToken',
      fakeJwt({ id: '1', email: 'a@b.com', role: 'Admin', permission: [], exp: Math.floor(Date.now() / 1000) - 60, iat: 0 })
    );
    const service = TestBed.inject(AuthService);
    expect(service.isTokenExpired()).toBeTrue();
  });

  it('isTokenExpired() is false for a token whose exp is in the future', () => {
    localStorage.setItem(
      'accessToken',
      fakeJwt({ id: '1', email: 'a@b.com', role: 'Admin', permission: [], exp: Math.floor(Date.now() / 1000) + 3600, iat: 0 })
    );
    const service = TestBed.inject(AuthService);
    expect(service.isTokenExpired()).toBeFalse();
  });

  it('rehydrates the current user from a valid token already in localStorage (no currentUser entry)', () => {
    localStorage.setItem(
      'accessToken',
      fakeJwt({
        id: '7',
        email: 'satis@demo.local',
        role: 'SatisTemsilcisi',
        permission: ['Order.Read'],
        branchId: '2',
        isHeadquarters: 'false',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: 0
      })
    );

    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.email).toBe('satis@demo.local');
    expect(service.currentUser()?.branchId).toBe(2);
    expect(service.currentUser()?.isHeadquarters).toBeFalse();
  });

  it('clears auth state when the stored token is already expired', () => {
    localStorage.setItem(
      'accessToken',
      fakeJwt({ id: '7', email: 'x@y.com', role: 'Admin', permission: [], exp: Math.floor(Date.now() / 1000) - 10, iat: 0 })
    );

    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
