import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 

import { routes } from './app.routes';
import { loggingInterceptor } from './interceptors/logging.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';

// Fechas y números del DatePipe en español de Colombia ("23 de septiembre").
registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    provideRouter(
      routes,
      withComponentInputBinding(), // parámetros de ruta y query params llegan como inputs
      withPreloading(PreloadAllModules) // precarga las rutas diferidas en segundo plano
    ),

    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor, loggingInterceptor]) // authInterceptor agrega el token antes de que loggingInterceptor registre la petición
    )
  ]
};
