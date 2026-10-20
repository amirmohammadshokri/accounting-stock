import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { MatButtonModule } from '@angular/material/button';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

type LineRow = {
  id: number;
  _cid?: string;
  itemId: number | null;
  qty: number | null;
  unitPrice: number | null;
  vatRate: number | null;
  net?: string | null;
  vat?: string | null;
  gross?: string | null;
};

@Component({
  standalone: true,
  selector: 'app-line-actions-cell',
  imports: [CommonModule, ...APP_ICON_IMPORTS, MatButtonModule],
  template: `
    <button
      mat-icon-button
      color="warn"
      type="button"
      aria-label="حذف ردیف"
      (click)="onDelete($event)">
      <mat-icon [svgIcon]="'delete'"></mat-icon>
    </button>
  `,
  styles: [`
    :host { display:flex; align-items:center; justify-content:center; }
    button { width: 36px; height: 36px; }
    mat-icon { font-size:20px; width:20px; height:20px; }
  `]
})
export class LineActionsCell implements ICellRendererAngularComp {
  private params!: ICellRendererParams & { data: LineRow; onDelete?: (row: LineRow) => void };

  agInit(params: ICellRendererParams): void {
    this.params = params as any;
  }

  refresh(): boolean { return false; }

  onDelete(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.params?.onDelete) {
      this.params.onDelete(this.params.data as LineRow);
    }
  }
}
