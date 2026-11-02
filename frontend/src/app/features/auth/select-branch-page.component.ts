import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { BranchContextService } from '../../core/services/branch-context.service';

interface BranchChoice { id: number; name: string; code: string; isHeadquarters: boolean; }

@Component({standalone:true, imports:[FormsModule,MatFormFieldModule,MatSelectModule,MatButtonModule],
  template:`<section style="max-width:520px;margin:40px auto;padding:24px">
    <h1>انتخاب شعبه کاری</h1><p>عملیات و فهرست‌ها مربوط به شعبه انتخاب‌شده خواهند بود.</p>
    @if(error){<p role="alert">{{error}}</p>}
    <mat-form-field style="width:100%"><mat-label>شعبه فعال</mat-label>
      <mat-select [(ngModel)]="selectedId">@for(branch of branches;track branch.id){
        <mat-option [value]="branch.id">{{branch.name}} — {{branch.code}}</mat-option>
      }</mat-select>
    </mat-form-field>
    <button mat-flat-button [disabled]="!selectedId || loading" (click)="confirm()">تأیید شعبه و شروع کار</button>
  </section>`})
export class SelectBranchPageComponent implements OnInit {
  private http=inject(HttpClient); private auth=inject(AuthService); private context=inject(BranchContextService);
  branches:BranchChoice[]=[]; selectedId:number|null=null; loading=true; error=''; canViewAll=false;
  ngOnInit():void {
    this.http.get<{branches:BranchChoice[];defaultBranchId:number|null;canViewAll:boolean}>(`${environment.apiBaseUrl}/auth/branches`)
      .subscribe({next:result=>{
        this.branches=result.branches;this.canViewAll=result.canViewAll;
        this.selectedId=this.branches.some(b=>b.id===result.defaultBranchId)?result.defaultBranchId:null;
        this.loading=false;
        if(!this.branches.length)this.error='شعبه مجازی برای شما تعیین نشده؛ از مدیر بخواهید شعبه پیش‌فرض و شعب مجاز را مشخص کند.';
      },error:()=>{this.loading=false;this.error='دریافت شعب مجاز انجام نشد؛ دوباره تلاش کنید.';}});
  }
  confirm():void {
    const branch=this.branches.find(b=>b.id===this.selectedId);const user=this.auth.currentUser();
    if(!branch || !user)return;
    this.context.select(branch,user.id,this.canViewAll);
    // Recreate page instances and discard cached data from the previous branch.
    window.location.assign('/');
  }
}
