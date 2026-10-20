import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { BranchesService } from '../../core/services/branches.service';
import { ContactsService } from '../../core/services/contacts.service';
import { ReportsService } from '../../core/services/reports.service';
import { IncomeExpenseReportPageComponent } from './income-expense-report-page.component';
import { ContactStatementPageComponent } from './contact-statement-page.component';

describe('Report filter reset',()=>{
  it('keeps the assigned branch when a branch user clears report dates',()=>{
    const query=jasmine.createSpy('query').and.returnValue(of({}));
    TestBed.configureTestingModule({providers:[{provide:ReportsService,useValue:{getIncomeExpense:query}},
      {provide:BranchesService,useValue:{}},{provide:AuthService,useValue:{currentUser:()=>({branchId:7})}}]});
    const component=TestBed.runInInjectionContext(()=>new IncomeExpenseReportPageComponent(TestBed.inject(ReportsService),TestBed.inject(BranchesService),TestBed.inject(AuthService)));
    component.branchId=7;component.fromDate='2026-01-01';component.toDate='2026-02-01';component.resetFilters();
    expect(query).toHaveBeenCalledWith(7,null,null);
    expect(component.fromDate).toBeNull();expect(component.toDate).toBeNull();
  });
  it('clears the selected contact and dates without requesting a statement for a missing contact',()=>{
    const query=jasmine.createSpy('query');
    TestBed.configureTestingModule({providers:[{provide:ReportsService,useValue:{getContactStatement:query}},
      {provide:ContactsService,useValue:{}},{provide:MatSnackBar,useValue:{}}]});
    const component=TestBed.runInInjectionContext(()=>new ContactStatementPageComponent(TestBed.inject(ReportsService),TestBed.inject(ContactsService),TestBed.inject(MatSnackBar)));
    component.contactId=5;component.fromDate='2026-01-01';component.error='خطای قبلی';component.resetFilters();
    expect(component.contactId).toBeNull();expect(component.fromDate).toBeNull();expect(component.error).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
});
