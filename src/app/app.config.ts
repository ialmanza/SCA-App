import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
<<<<<<< HEAD
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(),
    importProvidersFrom([SweetAlert2Module.forRoot()])
  ]
=======
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(), provideAnimationsAsync()]
>>>>>>> c901ca18d608b0b2b4daf4179a6d796e16937987
};
