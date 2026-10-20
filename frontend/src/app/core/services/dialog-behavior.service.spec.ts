import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { DialogBehaviorService } from './dialog-behavior.service';
describe('Shared dialog behavior',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[provideNoopAnimations(),{provide:MAT_DIALOG_DEFAULT_OPTIONS,useValue:{disableClose:true,closeOnNavigation:false,hasBackdrop:true,enterAnimationDuration:0,exitAnimationDuration:0}}]}));
  afterEach(()=>TestBed.inject(MatDialog).closeAll());
  it('adds a drag handle and explicit close button and survives backdrop and Escape',fakeAsync(()=>{
    TestBed.inject(DialogBehaviorService).start();
    const dialog=TestBed.inject(MatDialog);const ref=dialog.open(ConfirmDialogComponent,{data:{title:'آزمون',message:'متن'}});
    ref.componentRef?.changeDetectorRef.detectChanges();TestBed.inject(ApplicationRef).tick();tick();
    const container=document.getElementById(ref.id)!;const handle=container.querySelector('.app-dialog-handle');const close=container.querySelector<HTMLButtonElement>('.app-dialog-close');
    expect(handle).toBeTruthy();expect(close).toBeTruthy();expect(ref.disableClose).toBeTrue();
    document.querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();container.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));tick();
    expect(dialog.openDialogs.length).toBe(1);close!.click();flush();expect(dialog.openDialogs.length).toBe(0);
  }));
});
