import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UnitsService } from '../../core/services/units.service';
import { UnitDetailDto } from '../../core/models/unit.models';

export interface UnitFormDialogData { unit: UnitDetailDto | null; }
@Component({
  standalone:true, selector:'app-unit-form-dialog',
  imports:[ReactiveFormsModule,MatDialogModule,MatFormFieldModule,MatInputModule,MatButtonModule],
  template:`
    <h2 mat-dialog-title>{{data.unit ? 'ویرایش واحد کالا' : 'واحد کالای جدید'}}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        @if(error) {<p role="alert">{{error}}</p>}
        <mat-form-field appearance="outline"><mat-label>نام واحد</mat-label><input matInput formControlName="name" maxlength="16" autocomplete="off"><mat-hint>مانند عدد، کیلوگرم یا متر؛ حداکثر ۱۶ کاراکتر</mat-hint><mat-error>نام واحد الزامی است و باید حداکثر ۱۶ کاراکتر باشد.</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>شرح (اختیاری)</mat-label><textarea matInput formControlName="description" maxlength="500" rows="3"></textarea><mat-error>شرح باید حداکثر ۵۰۰ کاراکتر باشد.</mat-error></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end"><button type="button" mat-button [disabled]="saving" (click)="ref.close()">انصراف</button><button type="submit" mat-flat-button [disabled]="saving || form.invalid">{{saving ? 'در حال ذخیره…' : 'ذخیره'}}</button></mat-dialog-actions>
    </form>
  `,
  styles:[`.fields{display:flex;flex-direction:column;gap:16px;padding-top:8px} [role=alert]{color:var(--mat-sys-error)}`]
})
export class UnitFormDialogComponent {
  readonly data=inject<UnitFormDialogData>(MAT_DIALOG_DATA);
  readonly ref=inject(MatDialogRef<UnitFormDialogComponent>);
  private service=inject(UnitsService);
  private fb=inject(FormBuilder);
  saving=false; error:string|null=null;
  form=this.fb.nonNullable.group({name:[this.data.unit?.name ?? '',[Validators.required,Validators.maxLength(16),Validators.pattern(/\S/)]],description:[this.data.unit?.description ?? '',Validators.maxLength(500)]});
  save() {
    if(this.saving || this.form.invalid){this.form.markAllAsTouched();return;}
    const value=this.form.getRawValue();const body={name:value.name.trim(),description:value.description.trim() || null};
    this.saving=true;this.error=null;this.ref.disableClose=true;this.form.disable();
    const request=this.data.unit ? this.service.update(this.data.unit.id,{...body,id:this.data.unit.id,rowVersion:this.data.unit.rowVersion}) : this.service.create(body);
    request.subscribe({next:result=>this.ref.close(result),error:err=>{this.saving=false;this.ref.disableClose=true;this.form.enable();this.error=err?.error?.detail || err?.error?.message || 'ذخیره واحد کالا ناموفق بود.';}});
  }
}
