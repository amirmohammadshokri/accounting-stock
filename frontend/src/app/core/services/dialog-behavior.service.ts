import { DOCUMENT } from '@angular/common';
import { Injectable, inject, NgZone } from '@angular/core';
import { DragDrop } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs/operators';

/** One behavior for every form, confirmation and lookup dialog in the application. */
@Injectable({providedIn:'root'})
export class DialogBehaviorService {
  private readonly dialogs = inject(MatDialog);
  private readonly dragDrop = inject(DragDrop);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.dialogs.afterOpened.subscribe(ref => {
      ref.disableClose = true;
      // The service event fires before Angular has rendered the dialog DOM.
      ref.afterOpened().pipe(take(1)).subscribe(() => this.attach(ref));
    });
  }

  private attach(ref: MatDialogRef<unknown>): void {
    ref.disableClose = true;
    const container = this.document.getElementById(ref.id);
    const pane = container?.closest<HTMLElement>('.cdk-overlay-pane');
    if (!container || !pane) return;
    let title = container.querySelector<HTMLElement>('[mat-dialog-title],.mat-mdc-dialog-title');
    if (!title) {
      title = this.document.createElement('div');
      title.textContent = 'پنجره';
      container.querySelector('.mat-mdc-dialog-surface')?.prepend(title);
    }
    title.classList.add('app-dialog-handle');
    title.setAttribute('title','برای جابه‌جایی، عنوان پنجره را بکشید');
    const close = this.document.createElement('button');
    close.type = 'button'; close.className = 'app-dialog-close';
    close.setAttribute('aria-label','بستن پنجره'); close.setAttribute('title','بستن');
    close.textContent = '×';
    const closeDialog = (event: MouseEvent): void => {event.stopPropagation();this.zone.run(()=>ref.close());};
    close.addEventListener('click',closeDialog);
    title.appendChild(close);
    const drag = this.dragDrop.createDrag(pane).withHandles([title]);
    const boundary = pane.closest<HTMLElement>('.cdk-overlay-container');
    if (boundary) drag.withBoundaryElement(boundary);
    ref.afterClosed().pipe(take(1)).subscribe(()=>{close.removeEventListener('click',closeDialog);drag.dispose();});
  }
}
