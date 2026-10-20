import { Component,Input,Output,EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OpeningReference } from '../../core/models/opening-balance.models';
@Component({standalone:true,selector:'app-opening-entity-select',imports:[FormsModule,MatFormFieldModule,MatInputModule,MatSelectModule],template:`
  <div class="picker"><mat-form-field appearance="outline"><mat-label>جستجوی {{label}}</mat-label><input matInput [(ngModel)]="search" [disabled]="disabled" [ngModelOptions]="{standalone:true}"></mat-form-field>
  <mat-form-field appearance="outline"><mat-label>{{label}}</mat-label><mat-select [value]="value" (selectionChange)="valueChange.emit($event.value)" [disabled]="disabled"><mat-option [value]="null">—</mat-option>@for(row of options;track row.id){<mat-option [value]="row.id">{{row.code ? row.code+' — ' : ''}}{{row.name}}</mat-option>}</mat-select><mat-hint>اگر نتیجه زیاد است، جستجو را محدود کنید.</mat-hint></mat-form-field></div>
`,styles:[`:host{display:block}.picker{display:flex;gap:8px;flex-wrap:wrap}mat-form-field{flex:1;min-width:180px}`]})
export class OpeningEntitySelectComponent {
  @Input() rows:OpeningReference[]=[];@Input() label='';@Input() value:number|null=null;@Input() disabled=false;
  @Output() valueChange=new EventEmitter<number|null>();search='';
  get options(){const rows=this.rows.filter(row=>(row.name+' '+(row.code??'')).toLocaleLowerCase().includes(this.search.trim().toLocaleLowerCase())).slice(0,200);const selected=this.rows.find(row=>row.id===this.value);return selected && !rows.some(row=>row.id===selected.id)?[selected,...rows]:rows;}
}
