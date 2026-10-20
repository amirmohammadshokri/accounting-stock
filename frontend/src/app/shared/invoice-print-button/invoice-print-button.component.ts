import { RouterModule } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';
import { INVOICE_PRINT_FORMATS } from '../../core/models/invoice-print-layout.models';
import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoicePrintService } from '../../core/services/invoice-print.service';

@Component({
  selector: 'app-invoice-print-button', standalone: true,
  imports: [RouterModule, MatButtonModule, ...APP_ICON_IMPORTS, MatMenuModule, MatTooltipModule],
  template: `
    @if (compact) {
      <button type="button" mat-icon-button [matMenuTriggerFor]="menu" [disabled]="print.isDownloading(invoiceId)" matTooltip="چاپ و دانلود PDF" aria-label="چاپ و دانلود PDF"><mat-icon [svgIcon]="'print'"></mat-icon></button>
    } @else {
      <button type="button" mat-stroked-button [matMenuTriggerFor]="menu" [disabled]="print.isDownloading(invoiceId)"><mat-icon [svgIcon]="'print'"></mat-icon>{{ print.isDownloading(invoiceId) ? 'در حال آماده‌سازی PDF…' : 'چاپ و دانلود PDF' }}</button>
    }
    <mat-menu #menu="matMenu">
      @for (format of formats; track format.value) {
        <button type="button" mat-menu-item [matMenuTriggerFor]="actions">{{format.label}}</button>
        <mat-menu #actions="matMenu">
          <button type="button" mat-menu-item (click)="print.open(invoiceId, format.value)"><mat-icon [svgIcon]="'visibility'"></mat-icon><span>پیش‌نمایش و چاپ {{format.label}}</span></button>
          <button type="button" mat-menu-item (click)="print.download(invoiceId, format.value)"><mat-icon [svgIcon]="'download'"></mat-icon><span>دانلود PDF {{format.label}}</span></button>
          @if (canEdit) {
            <a mat-menu-item routerLink="/invoice-print-layouts" [queryParams]="{format:format.value, invoiceId:invoiceId}"><mat-icon [svgIcon]="'edit'"></mat-icon>ویرایش این قالب</a>
          }
        </mat-menu>
      }
    </mat-menu>
  `,
  styles: [`:host { display:inline-block; } button[mat-icon-button] { width:32px; height:32px; padding:6px; --mdc-icon-button-state-layer-size:32px; --mat-icon-button-touch-target-display:none; } button[mat-icon-button] mat-icon { font-size:20px; line-height:20px; width:20px; height:20px; }`]
})
export class InvoicePrintButtonComponent {
  @Input({required:true}) invoiceId!: number;
  @Input() compact = false;
  readonly formats = INVOICE_PRINT_FORMATS;
  readonly canEdit = inject(PermissionService).has('CompanySettings.Read') && inject(PermissionService).has('CompanySettings.Update');
  readonly print = inject(InvoicePrintService);
}
