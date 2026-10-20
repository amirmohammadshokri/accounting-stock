import { LicenseService } from './core/services/license.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { APP_ICON_IMPORTS } from './core/icons/app-svg-icon.directive';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/services/auth.service';
import { PermissionService } from './core/services/permission.service';
import { HasPermissionDirective } from './shared/directives/has-permission.directive';
import { AppearanceService } from './core/services/appearance.service';
import { NavigationService } from './core/services/navigation.service';

import { APP_BRAND } from './core/app-brand';
import { Title } from '@angular/platform-browser';

import { NAV_GROUPS } from './core/navigation-menu';
import { NavigationMenuService } from './core/services/navigation-menu.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, ...APP_ICON_IMPORTS, MatListModule,
    MatButtonModule, MatMenuModule, MatDividerModule, MatTooltipModule,
    HasPermissionDirective
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly license = inject(LicenseService);
  readonly brand = APP_BRAND;
  appearance = inject(AppearanceService);
  navigation = inject(NavigationService);
  authService = inject(AuthService);
  permissionService = inject(PermissionService);
  private menu = inject(NavigationMenuService);

  opened = signal(true);

  // Computed values from auth service
  isAuthenticated = computed(()=>this.authService.isAuthenticated() && !this.license.isExpired());
  currentUser = this.authService.currentUser;
  isAdmin = this.authService.isAdmin;
  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  isMobile=signal(false);
  openGroups=signal<ReadonlySet<string>>(new Set(['sales']));
  readonly navGroups = NAV_GROUPS;
  visibleNavGroups=this.menu.groups;
  constructor(){
    this.license.start();
    inject(Title).setTitle(this.brand.cateringName);
    inject(BreakpointObserver).observe('(max-width:900px)').pipe(takeUntilDestroyed()).subscribe(r=>{this.isMobile.set(r.matches);this.opened.set(!r.matches);});
    const router=inject(Router);
    router.events.pipe(filter((e):e is NavigationEnd=>e instanceof NavigationEnd),takeUntilDestroyed()).subscribe(e=>{
      const group=this.navGroups.find(g=>g.items.some(i=>e.urlAfterRedirects.split('?')[0]===i.path||e.urlAfterRedirects.startsWith(i.path+'/')));
      if(group)this.openGroups.update(old=>new Set([...old,group.id]));
      if(this.isMobile())this.opened.set(false);
      if(this.license.isExpired() && e.urlAfterRedirects !== '/license-expired') void router.navigateByUrl('/license-expired');
    });
  }
  toggleGroup(id:string):void{this.openGroups.update(old=>{const next=new Set(old);next.has(id)?next.delete(id):next.add(id);return next;});}

  onLogout(): void {
    this.authService.logout();
  }
}
