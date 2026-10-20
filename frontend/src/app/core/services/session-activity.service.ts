import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { SessionStatus } from '../models/auth.models';
import { HANDLE_ERROR_LOCALLY } from '../interceptors/http-problem-interceptor';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SessionActivityService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  private pending = false;
  private sending = false;
  private lastSent = 0;

  start(): void {
    if (this.started) return;
    this.started = true;
    if (this.auth.getToken()) this.requestStatus(false);
    const activity = (event: Event) => {
      if (!event.isTrusted || !this.auth.getToken()) return;
      if (this.expired()) return;
      this.pending = true;
      this.flushActivity();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === 'authSession' || event.key === 'accessToken' || event.key === 'currentUser') {
        this.zone.run(() => this.auth.syncFromStorage());
      }
    };
    const resume = () => {
      if (document.visibilityState === 'visible' && this.auth.getToken() && !this.expired()) {
        this.requestStatus(false);
      }
    };
    this.zone.runOutsideAngular(() => {
      const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
      for (const type of events) document.addEventListener(type, activity, { passive: true });
      window.addEventListener('storage', storage);
      document.addEventListener('visibilitychange', resume);
      const timer = window.setInterval(() => {
        if (!this.auth.getToken()) { this.pending = false; return; }
        if (!this.expired()) this.flushActivity();
      }, 1000);
      this.destroyRef.onDestroy(() => {
        for (const type of events) document.removeEventListener(type, activity);
        window.removeEventListener('storage', storage);
        document.removeEventListener('visibilitychange', resume);
        window.clearInterval(timer);
      });
    });
  }

  private expired(): boolean {
    const state = this.auth.sessionState();
    if (!state) return false;
    const now = Date.now() + state.serverOffsetMs;
    const deadline = Math.min(Date.parse(state.status.absoluteExpiresAtUtc), Date.parse(state.status.idleExpiresAtUtc));
    if (now < deadline) return false;
    this.pending = false;
    this.zone.run(() => this.auth.logout());
    return true;
  }

  private flushActivity(): void {
    // Timers, polling and token refresh never manufacture activity. Only input sets pending.
    if (!this.pending || this.sending || Date.now() - this.lastSent < 5000) return;
    this.pending = false;
    this.lastSent = Date.now();
    this.requestStatus(true);
  }

  private requestStatus(activity: boolean): void {
    if (this.sending) return;
    this.sending = true;
    const token = this.auth.getToken();
    const sid = this.auth.sessionState()?.status.sessionId;
    const options = { context: new HttpContext().set(HANDLE_ERROR_LOCALLY, true) };
    const request = activity
      ? this.http.post<SessionStatus>(`${environment.apiBaseUrl}/auth/activity`, {}, options)
      : this.http.get<SessionStatus>(`${environment.apiBaseUrl}/auth/session`, options);
    request.subscribe({
      next: status => {
        this.sending = false;
        // An in-flight reply must not restore a logged-out session or replace a newer login.
        const currentSid = this.auth.sessionState()?.status.sessionId;
        if (!this.auth.getToken() || (sid && currentSid !== sid) || (currentSid && currentSid !== status.sessionId)) return;
        this.zone.run(() => this.auth.updateSession(status));
      },
      error: (error: HttpErrorResponse) => {
        this.sending = false;
        if (error.status === 401 && this.auth.getToken() === token) this.zone.run(() => this.auth.logout());
      }
    });
  }
}
