import { PersianDateFieldComponent } from '../../shared/persian-date-field/persian-date-field.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Observable, map } from 'rxjs';
import { EntityPickerComponent, PickerOption } from '../../shared/entity-picker/entity-picker.component';
import { WarehousesService } from '../../core/services/warehouses.service';
import { ItemsService } from '../../core/services/items.service';
import { StockMovementType, getMovementTypeDisplayName } from '../../core/models/stock-movement.models';

export interface StockMovementFormDialogData {
  warehouseId?: number | null;
  warehouseLabel?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-stock-movement-form-dialog',
  imports: [PersianDateFieldComponent,
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, EntityPickerComponent
  ],
  template: `
    <h2 mat-dialog-title>گردش انبار جدید</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <app-entity-picker
          label="انبار"
          [fetcher]="warehouseFetcher"
          [value]="form.value.warehouseId ?? null"
          [initialLabel]="data.warehouseLabel ?? null"
          [width]="'100%'"
          (valueChange)="onWarehouseSelected($event)">
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
            <mat-label>نوع گردش</mat-label>
            <mat-select formControlName="type">
              @for (t of movementTypes; track t) {
                <mat-option [value]="t">{{ typeLabel(t) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <app-persian-date-field label="تاریخ" mode="datetime" formControlName="transactionDateUtc"></app-persian-date-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>مقدار</mat-label>
          <input matInput formControlName="quantity" placeholder="0.000" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>یادداشت (اختیاری)</mat-label>
          <input matInput formControlName="note" maxlength="500" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button (click)="dialogRef.close(null)">انصراف</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .fields { display:flex; flex-direction:column; gap:8px; min-width:420px; padding-top:8px; }
    .row { display:flex; gap:10px; }
    .row mat-form-field { flex:1; }
  `]
})
export class StockMovementFormDialogComponent {
  dialogRef = inject(MatDialogRef<StockMovementFormDialogComponent>);
  data = inject<StockMovementFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private warehousesService = inject(WarehousesService);
  private itemsService = inject(ItemsService);

  movementTypes = [
    StockMovementType.PurchaseIn,
    StockMovementType.SalesOut,
    StockMovementType.AdjustmentIn,
    StockMovementType.AdjustmentOut,
    StockMovementType.SalesReturn,
    StockMovementType.PurchaseReturn
  ];

  typeLabel = getMovementTypeDisplayName;

  form = this.fb.group({
    warehouseId: [this.data.warehouseId ?? null, Validators.required],
    itemId: [null as number | null, Validators.required],
    type: [StockMovementType.PurchaseIn, Validators.required],
    transactionDateUtc: [this.toLocalInputValue(), Validators.required],
    quantity: ['', Validators.required],
    note: ['']
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

  onWarehouseSelected(id: number | null) {
    this.form.patchValue({ warehouseId: id });
  }

  onItemSelected(id: number | null) {
    this.form.patchValue({ itemId: id });
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      warehouseId: Number(v.warehouseId),
      itemId: Number(v.itemId),
      type: Number(v.type),
      quantity: String(v.quantity).replace(',', '.').trim(),
      transactionDateUtc: this.localToUtcIso(v.transactionDateUtc!),
      note: v.note || null
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
