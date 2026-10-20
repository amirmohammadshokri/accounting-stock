import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable, map } from 'rxjs';
import { EntityPickerComponent, PickerOption } from '../../shared/entity-picker/entity-picker.component';
import { WarehousesService } from '../../core/services/warehouses.service';
import { ItemsService } from '../../core/services/items.service';

@Component({
  standalone: true,
  selector: 'app-stock-transfer-dialog',
  imports: [PersianDateFieldComponent,
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, EntityPickerComponent
  ],
  template: `
    <h2 mat-dialog-title>انتقال بین انبارها</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <app-entity-picker
          label="انبار مبدأ"
          [fetcher]="warehouseFetcher"
          [value]="form.value.sourceWarehouseId ?? null"
          [width]="'100%'"
          (valueChange)="onSourceSelected($event)">
        </app-entity-picker>

        <app-entity-picker
          label="انبار مقصد"
          [fetcher]="warehouseFetcher"
          [value]="form.value.targetWarehouseId ?? null"
          [width]="'100%'"
          (valueChange)="onTargetSelected($event)">
        </app-entity-picker>

        <app-entity-picker
          label="کالا"
          [fetcher]="itemFetcher"
          [value]="form.value.itemId ?? null"
          [width]="'100%'"
          (valueChange)="onItemSelected($event)">
        </app-entity-picker>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>مقدار</mat-label>
            <input matInput formControlName="quantity" placeholder="0.000" />
          </mat-form-field>
          <app-persian-date-field label="تاریخ" mode="datetime" formControlName="transactionDateUtc"></app-persian-date-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>شرح (اختیاری)</mat-label>
          <input matInput formControlName="description" maxlength="500" />
        </mat-form-field>

        @if (form.value.sourceWarehouseId && form.value.targetWarehouseId && form.value.sourceWarehouseId === form.value.targetWarehouseId) {
          <div class="error">انبار مبدأ و مقصد باید متفاوت باشند.</div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid || sameWarehouse()">انتقال</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:420px; padding-top:8px; }
    .row { display:flex; gap:10px; }
    .row mat-form-field { flex:1; }
    .error { color: var(--mat-sys-error, #b3261e); font-size: 0.85em; }
  `]
})
export class StockTransferDialogComponent {
  dialogRef = inject(MatDialogRef<StockTransferDialogComponent>);
  private fb = inject(FormBuilder);
  private warehousesService = inject(WarehousesService);
  private itemsService = inject(ItemsService);

  form = this.fb.group({
    sourceWarehouseId: [null as number | null, Validators.required],
    targetWarehouseId: [null as number | null, Validators.required],
    itemId: [null as number | null, Validators.required],
    quantity: ['', Validators.required],
    transactionDateUtc: [this.toLocalInputValue(), Validators.required],
    description: ['']
  });

  warehouseFetcher = (search: string): Observable<PickerOption[]> =>
    this.warehousesService.list({ pageSize: 20 }).pipe(
      map(res => res.items
        .filter(w => !search || w.code.toLowerCase().includes(search.toLowerCase()) || w.name.toLowerCase().includes(search.toLowerCase()))
        .map(w => ({ id: w.id, label: w.code, sublabel: w.name })))
    );

  itemFetcher = (search: string): Observable<PickerOption[]> =>
    this.itemsService.list({ search: search || null, pageSize: 20 }).pipe(
      map(res => res.items.map(i => ({ id: i.id, label: i.code, sublabel: i.name })))
    );

  onSourceSelected(id: number | null) { this.form.patchValue({ sourceWarehouseId: id }); }
  onTargetSelected(id: number | null) { this.form.patchValue({ targetWarehouseId: id }); }
  onItemSelected(id: number | null) { this.form.patchValue({ itemId: id }); }

  sameWarehouse(): boolean {
    const v = this.form.value;
    return !!v.sourceWarehouseId && !!v.targetWarehouseId && v.sourceWarehouseId === v.targetWarehouseId;
  }

  save() {
    if (this.form.invalid || this.sameWarehouse()) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      sourceWarehouseId: Number(v.sourceWarehouseId),
      targetWarehouseId: Number(v.targetWarehouseId),
      itemId: Number(v.itemId),
      quantity: String(v.quantity).replace(',', '.').trim(),
      transactionDateUtc: this.localToUtcIso(v.transactionDateUtc!),
      description: v.description || null
    });
  }

  private toLocalInputValue(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  private localToUtcIso(localStr: string): string {
    return new Date(localStr).toISOString();
  }
}
