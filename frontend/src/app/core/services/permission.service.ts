/**
 * Permission Service
 * Backend: Accounting.Domain.Constants.Permissions (JWT'nin "permission" claim listesi)
 *
 * AuthService, login sırasında JWT'deki permission claim'lerini CurrentUser.permissions'a
 * çözümlüyor (Admin rolü DataSeeder'da Permissions.GetAll() ile tüm izinlere sahip oluyor,
 * yani burada ayrıca bir isAdmin bypass'ına gerek yok — Admin zaten her izni JWT'de taşıyor).
 */
import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private authService = inject(AuthService);

  /**
   * Kullanıcının verilen izne sahip olup olmadığını kontrol eder.
   * Örn: hasPermission('Invoice.Create')
   */
  has(permission: string): boolean {
    return this.authService.currentUser()?.permissions.includes(permission) ?? false;
  }

  /**
   * Kullanıcının verilen izinlerden en az birine sahip olup olmadığını kontrol eder.
   */
  hasAny(permissions: string[]): boolean {
    if (permissions.length === 0) return true;
    const userPermissions = this.authService.currentUser()?.permissions ?? [];
    return permissions.some(p => userPermissions.includes(p));
  }

  /**
   * Kullanıcının verilen izinlerin tamamına sahip olup olmadığını kontrol eder.
   */
  hasAll(permissions: string[]): boolean {
    if (permissions.length === 0) return true;
    const userPermissions = this.authService.currentUser()?.permissions ?? [];
    return permissions.every(p => userPermissions.includes(p));
  }
}
