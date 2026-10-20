import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LoginPageComponent } from './login-page.component';
describe('Friendly login',()=>{
  let login:jasmine.Spy;
  beforeEach(()=>{login=jasmine.createSpy();TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{login}},{provide:Router,useValue:{navigate:jasmine.createSpy()}},{provide:MatSnackBar,useValue:{open:jasmine.createSpy()}}]});});
  const create=()=>TestBed.runInInjectionContext(()=>new LoginPageComponent());
  it('starts empty, trims email and blocks duplicate submissions without altering the password',()=>{
    const form=create();expect(form.form.value).toEqual({email:'',password:''});login.and.returnValue(new Observable(()=>{}));
    form.form.setValue({email:' admin@demo.local ',password:' Demo1405! '});form.onSubmit();form.onSubmit();expect(login).toHaveBeenCalledOnceWith({email:'admin@demo.local',password:' Demo1405! '});
  });
  it('explains connectivity problems inline and permits retry',()=>{
    const form=create();login.and.returnValue(throwError(()=>({status:0})));form.form.setValue({email:'admin@demo.local',password:'wrong'});form.onSubmit();
    expect(form.errorMessage()).toContain('ارتباط');expect(form.loading()).toBeFalse();
  });
});
