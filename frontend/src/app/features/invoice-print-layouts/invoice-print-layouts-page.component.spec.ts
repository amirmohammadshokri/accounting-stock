import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoicePrintLayoutsService } from '../../core/services/invoice-print-layouts.service';
import { InvoicePrintService } from '../../core/services/invoice-print.service';
import { InvoicePrintLayoutsPageComponent } from './invoice-print-layouts-page.component';

describe('Invoice designs',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[
    {provide:InvoicePrintLayoutsService,useValue:{}},{provide:InvoicePrintService,useValue:{}},
    {provide:ActivatedRoute,useValue:{}},{provide:MatSnackBar,useValue:{open:()=>{}}}
  ]}));
  it('applies a printable preset while retaining customer rules and column order',()=>{
    const component=TestBed.runInInjectionContext(()=>new InvoicePrintLayoutsPageComponent());
    component.form.patchValue({terms:'تحویل ساعت ۱۲',headerText:'بهار',title:'فاکتور پذیرایی'});
    const columns=component.form.controls.columnOrder.value;
    component.applyPreset('garden');
    expect(component.form.valid).toBeTrue();
    expect(component.form.controls.terms.value).toBe('تحویل ساعت ۱۲');
    expect(component.form.controls.title.value).toBe('فاکتور پذیرایی');
    expect(component.form.controls.columnOrder.value).toBe(columns);
    expect(component.form.controls.headerColor.value).toBe('#dceee5');
    expect(component.previewRows.length).toBeGreaterThanOrEqual(10);
  });
});
