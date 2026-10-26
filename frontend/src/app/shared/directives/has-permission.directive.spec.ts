import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/services/auth.service';
import { HasPermissionDirective } from './has-permission.directive';

@Component({ standalone: true, imports: [HasPermissionDirective], template:
  `<button *appHasPermission="'Invoice.Delete'">Delete</button>` })
class PermissionHost {}

describe('HasPermissionDirective', () => {
  it('removes an existing action when the current user loses its permission', () => {
    const currentUser = signal({permissions: ['Invoice.Delete']});
    TestBed.configureTestingModule({providers: [
      {provide: AuthService, useValue: {currentUser}}
    ]});
    const fixture = TestBed.createComponent(PermissionHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
    currentUser.set({permissions: ['Invoice.Read']});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
