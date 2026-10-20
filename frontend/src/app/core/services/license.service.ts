import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HANDLE_ERROR_LOCALLY } from '../interceptors/http-problem-interceptor';

export interface LicenseStatus {
  expiresAtUtc: string | null;
  serverTimeUtc: string;
  isExpired: boolean;
  remainingDays: number | null;
  showWarning: boolean;
}

@Injectable({providedIn:'root'})
export class LicenseService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly status = signal<LicenseStatus | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly isExpired = computed(()=>this.status()?.isExpired ?? false);
  private started = false;
  private readonly destroyRef=inject(DestroyRef);

  start(): void {
    if (this.started) return;
    this.started = true;
    this.reload();
    // Uses server time, never the customer's computer clock.
    const timer=window.setInterval(()=>this.reload(), 60_000);
    this.destroyRef.onDestroy(()=>window.clearInterval(timer));
  }
  reload(onActive?:()=>void): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.http.get<LicenseStatus>(`${environment.apiBaseUrl}/license`, {
      context: new HttpContext().set(HANDLE_ERROR_LOCALLY,true)
    }).subscribe({
      next: status=>{
        this.status.set(status); this.error.set(false); this.loading.set(false);
        if (status.isExpired) void this.router.navigateByUrl('/license-expired');
        else onActive?.();
      },
      error: ()=>{this.loading.set(false);this.error.set(true);}
    });
  }
  markExpired(): void {
    this.status.update(old=>({expiresAtUtc:old?.expiresAtUtc ?? null,serverTimeUtc:old?.serverTimeUtc ?? '',isExpired:true,remainingDays:0,showWarning:false}));
    void this.router.navigateByUrl('/license-expired');
  }
}
