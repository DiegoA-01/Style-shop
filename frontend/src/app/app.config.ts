import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 

import { routes } from './app.routes';
import { loggingInterceptor } from './interceptors/logging.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
