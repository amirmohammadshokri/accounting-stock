/**
 * Permission Guard
 * Route'a girebilmek için JWT permission claim'lerinden birinin gerekli olduğunu kontrol eder.
 *
 * Neden gerekli: Sidenav bu route'lara giden linki izne göre gizliyor
 * (bkz. app.component.html + HasPermissionDirective), ama linki gizlemek URL'e
 * doğrudan gitmeyi engellemez — kullanıcı adres çubuğuna yazarak (veya eski bir
 * bookmark ile) izni olmayan bir sayfaya ulaşabilirdi. Bu guard, sidenav'ın
 * gizlediği her rotayı da canActivate seviyesinde kapatır.
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PermissionService } from '../services/permission.service';

/**
 * Sidenav'daki (app.component.html) sırayla aynı — kullanıcının erişebileceği
 * ilk rotayı bulmak için kullanılır (izinsiz bir sayfaya gidilmeye çalışılınca
 * buraya düşülür, sonsuz redirect döngüsü olmaması için).
 */
export const NAV_PERMISSIONS: { path: string; permission: string }[] = [
  { path: '/dashboard', permission: 'Report.Dashboard' },
  { path: '/payments', permission: 'Payment.Read' },
  { path: '/invoices', permission: 'Invoice.Read' },
  { path: '/orders', permission: 'Order.Read' },
  { path: '/items', permission: 'Item.Read' },
  { path: '/contacts', permission: 'Contact.Read' },
  { path: '/branches', permission: 'Branch.Read' },
  { path: '/warehouses', permission: 'Warehouse.Read' },
  { path: '/cash-bank-accounts', permission: 'CashBankAccount.Read' },
  { path: '/cheques', permission: 'Cheque.Read' },
  { path: '/reports/contact-statement', permission: 'Report.ContactStatement' },
  { path: '/reports/stock-status', permission: 'Report.StockStatus' },
  { path: '/reports/income-expense', permission: 'Report.ProfitLoss' },
  { path: '/stocks', permission: 'Stock.Read' },
  { path: '/stock-movements', permission: 'StockMovement.Read' },
  { path: '/units', permission: 'Unit.Read' },
  { path: '/categories', permission: 'Category.Read' },
  { path: '/opening-balances', permission: 'Contact.Read' },
  { path: '/opening-balances', permission: 'Stock.Read' },
  { path: '/company-settings', permission: 'CompanySettings.Read' },
  { path: '/users', permission: 'User.Read' },
  { path: '/roles', permission: 'Role.Read' },
  { path: '/orders/new', permission: 'Order.Create' },
  { path: '/invoices/new', permission: 'Invoice.Create' }
];

export function firstAccessibleRoute(permissionService: PermissionService): string {
  return NAV_PERMISSIONS.find(r => permissionService.has(r.permission))?.path ?? '/appearance';
}

export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (permissionService.has(permission)) {
      return true;
    }

    return router.parseUrl(firstAccessibleRoute(permissionService));
  };
}

export const openingBalancesGuard:CanActivateFn=()=>{
  const permissions=inject(PermissionService);const router=inject(Router);
  return permissions.hasAny(['Contact.Read','Stock.Read'])?true:router.parseUrl(firstAccessibleRoute(permissions));
};
