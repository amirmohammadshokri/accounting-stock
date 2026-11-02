import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ContactFormDialogComponent } from './contact-form-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { BranchesService } from '../../core/services/branches.service';

describe('Expanded contact dialog layout',()=>{
  it('keeps save visible inside a short dialog while details scroll',async()=>{
    TestBed.configureTestingModule({imports:[ContactFormDialogComponent],providers:[
      provideNoopAnimations(),provideRouter([]),
      {provide:AuthService,useValue:{currentUser:()=>({branchId:2})}},
      {provide:PermissionService,useValue:{has:()=>true}},
      {provide:BranchesService,useValue:{list:()=>of([])}}
    ]});
    const dialog=TestBed.inject(MatDialog);
    const ref=dialog.open(ContactFormDialogComponent,{width:'680px',maxHeight:'440px',data:{contact:null,defaultBranchId:2}});
    TestBed.tick();
    await new Promise(resolve=>setTimeout(resolve,50));
    const surface=document.querySelector<HTMLElement>('.mat-mdc-dialog-surface')!;
    surface.querySelector<HTMLDetailsElement>('details')!.open=true;
    TestBed.tick();
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const button=surface.querySelector<HTMLElement>('button[type="submit"]')!;
    const content=surface.querySelector<HTMLElement>('mat-dialog-content')!;
    expect(button.getBoundingClientRect().bottom).toBeLessThanOrEqual(surface.getBoundingClientRect().bottom+1);
    expect(button.getBoundingClientRect().top).toBeGreaterThanOrEqual(surface.getBoundingClientRect().top);
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    ref.close();
  });
});
