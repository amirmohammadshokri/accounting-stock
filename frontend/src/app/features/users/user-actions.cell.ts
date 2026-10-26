import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APP_ICON_IMPORTS } from '../../core/icons/app-svg-icon.directive';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

export interface UserActionsContext<T = unknown> {
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onChangePassword?: (row: T) => void;
}

@Component({
  standalone: true,
  selector: 'app-user-actions-cell',
  imports: [HasPermissionDirective, MatTooltipModule, MatButtonModule, CommonModule, ...APP_ICON_IMPORTS],
  template: `
    <button *appHasPermission="'User.Update'" mat-icon-button class="icon-btn" type="button" (click)="edit()" matTooltip="ویرایش" aria-label="ویرایش">
      <mat-icon [svgIcon]="'edit'"></mat-icon>
    </button>
    <button *appHasPermission="'User.Update'" mat-icon-button class="icon-btn" type="button" (click)="changePassword()" matTooltip="تغییر رمز عبور" aria-label="تغییر رمز عبور">
      <mat-icon [svgIcon]="'key'"></mat-icon>
    </button>
    <button *appHasPermission="'User.Delete'" mat-icon-button class="icon-btn" type="button" (click)="remove()" matTooltip="حذف" aria-label="حذف">
      <mat-icon [svgIcon]="'delete'"></mat-icon>
    </button>
  `,
  styles: [`
    .icon-btn { --mdc-icon-button-state-layer-size: 32px; --mat-icon-button-touch-target-display: none; padding: 6px; }
    :host { display:flex; align-items:center; gap:4px; height:100%; }
    .icon-btn {
      width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center;
      border:none; background:transparent; cursor:pointer; border-radius:6px; color: inherit;
    }
    .icon-btn:hover { background: var(--mat-sys-secondary-container); }
    .icon-btn mat-icon { font-size:20px; line-height:20px; width:20px; height:20px; }
  `]
})
export class UserActionsCell implements ICellRendererAngularComp {
  private params!: ICellRendererParams;

  agInit(p: ICellRendererParams) { this.params = p; }
  refresh(): boolean { return false; }

  edit() {
    const ctx = this.params.context as UserActionsContext | undefined;
    ctx?.onEdit?.(this.params.data);
  }

  changePassword() {
    const ctx = this.params.context as UserActionsContext | undefined;
    ctx?.onChangePassword?.(this.params.data);
  }

  remove() {
    const ctx = this.params.context as UserActionsContext | undefined;
    ctx?.onDelete?.(this.params.data);
  }
}
