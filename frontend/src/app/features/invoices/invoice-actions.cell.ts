import { InvoicePrintButtonComponent } from '../../shared/invoice-print-button/invoice-print-button.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
// invoice-actions.cell.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  standalone: true,
  selector: 'app-invoice-actions-cell',
  imports: [InvoicePrintButtonComponent, MatTooltipModule, MatButtonModule, CommonModule, RouterModule, ...APP_ICON_IMPORTS],
  template: `
    <app-invoice-print-button *ngIf="canRead" [invoiceId]="id" [compact]="true"></app-invoice-print-button>
    <a mat-icon-button class="icon-btn" [routerLink]="['/invoices', id]" matTooltip="نمایش" aria-label="نمایش">
      <mat-icon [svgIcon]="'visibility'"></mat-icon>
    </a>
    <a mat-icon-button class="icon-btn" *ngIf="canUpdate" [routerLink]="['/invoices', id, 'edit']" matTooltip="ویرایش" aria-label="ویرایش">
      <mat-icon [svgIcon]="'edit'"></mat-icon>
    </a>
  `,
  styles: [`
    .icon-btn { --mdc-icon-button-state-layer-size: 32px; --mat-icon-button-touch-target-display: none; padding: 6px; }
    :host { display:flex; align-items:center; gap:6px; }
    .icon-btn { width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; border-radius:6px; }
    .icon-btn mat-icon { font-size:20px; line-height:20px; width:20px; height:20px; }
  `]
})
export class InvoiceActionsCell implements ICellRendererAngularComp {
  private permissionService = inject(PermissionService);
  canRead = this.permissionService.has('Invoice.Read');
  id!: number;
  canUpdate = this.permissionService.has('Invoice.Update');
  agInit(p: ICellRendererParams) { this.id = Number(p.data?.id ?? 0); }
  refresh(): boolean { return false; }
}
