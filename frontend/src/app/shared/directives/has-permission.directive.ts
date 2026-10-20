/**
 * *appHasPermission structural directive
 *
 * Kullanım:
 *   <button *appHasPermission="'Invoice.Create'">Yeni Fatura</button>
 *   <button *appHasPermission="['Invoice.Update', 'Invoice.Delete']">Düzenle/Sil</button>  <!-- hasAny -->
 *
 * Element, kullanıcı verilen izne (veya dizi verilirse en az birine) sahip değilse
 * DOM'a hiç eklenmez (ngIf gibi, sadece gizlemez — kaldırır).
 */
import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  standalone: true,
  selector: '[appHasPermission]'
})
export class HasPermissionDirective {
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;

  @Input() set appHasPermission(value: string | string[]) {
    const allowed = Array.isArray(value)
      ? this.permissionService.hasAny(value)
      : this.permissionService.has(value);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
