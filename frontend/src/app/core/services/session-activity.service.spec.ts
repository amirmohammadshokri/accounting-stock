import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionActivityService } from './session-activity.service';
import { SessionStatus } from '../models/auth.models';
import { environment } from '../../../environments/environment';

describe('SessionActivityService', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  let monitor: SessionActivityService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    monitor = TestBed.inject(SessionActivityService);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  function login(idleSeconds: number, absoluteSeconds: number): SessionStatus {
    const now = Date.now();
    const session: SessionStatus = {
      sessionId: 'test-session', serverTimeUtc: new Date(now).toISOString(),
      idleExpiresAtUtc: new Date(now + idleSeconds * 1000).toISOString(),
      absoluteExpiresAtUtc: new Date(now + absoluteSeconds * 1000).toISOString(),
      idleTimeoutSeconds: idleSeconds
    };
    const payload = btoa(JSON.stringify({ id: '1', exp: now / 1000 + 900, email: 'test@local', role: 'Admin', permission: [] }));
    auth.login({ email: 'test@local', password: 'unused' }).subscribe();
    http.expectOne(`${environment.apiBaseUrl}/auth/login`).flush({ id: 1, firstName: 'Test', lastName: 'User', email: 'test@local', accessToken: `e30.${payload}.signature`, session });
    return session;
  }

  it('does not send activity from timers, polling or synthetic input', fakeAsync(() => {
    const session = login(3600, 86400);
    monitor.start();
    http.expectOne(`${environment.apiBaseUrl}/auth/session`).flush(session);
    document.dispatchEvent(new Event('pointermove'));
    tick(20000);
    http.expectNone(`${environment.apiBaseUrl}/auth/activity`);
    expect(auth.isAuthenticated()).toBeTrue();
    discardPeriodicTasks();
  }));

  it('logs out without another API request when idle deadline passes', fakeAsync(() => {
    const session = login(3, 86400);
    monitor.start();
    http.expectOne(`${environment.apiBaseUrl}/auth/session`).flush(session);
    tick(3000);
    expect(auth.isAuthenticated()).toBeFalse();
    http.expectOne(`${environment.apiBaseUrl}/auth/logout`).flush(null);
    discardPeriodicTasks();
  }));

  it('enforces absolute expiry even when idle deadline is later', fakeAsync(() => {
    const session = login(3600, 2);
    monitor.start();
    http.expectOne(`${environment.apiBaseUrl}/auth/session`).flush(session);
    tick(2000);
    expect(auth.isAuthenticated()).toBeFalse();
    http.expectOne(`${environment.apiBaseUrl}/auth/logout`).flush(null);
    discardPeriodicTasks();
  }));
});
