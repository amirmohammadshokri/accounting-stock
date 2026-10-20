import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { firstAccessibleRoute } from '../guards/permission.guard';
import { PermissionService } from './permission.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);
  private permissions = inject(PermissionService);
  private visits = signal<string[]>([]);
  readonly canGoBack = computed(() => this.visits().length > 1 || this.fallback(this.visits().at(-1) ?? '') !== null);
  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed()).subscribe(event => {
      const url = event.urlAfterRedirects;
      if (url.startsWith('/login')) { this.visits.set([]); return; }
      this.visits.update(visits => visits.at(-1) === url ? visits : [...visits, url].slice(-50));
    });
  }
  back() {
    const visits = this.visits();
    const target = visits.length > 1 ? visits.at(-2)! : this.fallback(this.router.url);
    if (!target) return;
    this.visits.set(visits.length > 1 ? visits.slice(0, -1) : []);
    void this.router.navigateByUrl(target);
  }
  private fallback(url: string): string | null {
    if (!url || url.startsWith('/login')) return null;
    if (/^\/(invoices|orders)\//.test(url)) return '/' + url.split('/')[1];
    const home = firstAccessibleRoute(this.permissions);
    return home !== '/login' && home !== url ? home : null;
  }
}
