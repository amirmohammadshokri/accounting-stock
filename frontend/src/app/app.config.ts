import { AppSvgIcons } from './core/icons/app-svg-icon.directive';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { DialogBehaviorService } from './core/services/dialog-behavior.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import localeFa from '@angular/common/locales/fa';
import { registerLocaleData } from '@angular/common';

import { routes } from './app.routes';

import { httpProblemInterceptor } from '../app/core/interceptors/http-problem-interceptor';
import { authInterceptor } from '../app/core/interceptors/auth.interceptor';

registerLocaleData(localeFa);

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(()=>{inject(AppSvgIcons);}),
    {provide:MAT_DIALOG_DEFAULT_OPTIONS,useValue:{hasBackdrop:true,disableClose:true,closeOnNavigation:false,autoFocus:'first-tabbable',restoreFocus:true,maxWidth:'96vw',maxHeight:'94vh',direction:'rtl'}},
    provideAppInitializer(()=>inject(DialogBehaviorService).start()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,          // Auth interceptor ÖNCE (token ekler)
        httpProblemInterceptor    // Problem interceptor SONRA (hata yakalar)
      ])),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'fa-IR' },
  ]
};
