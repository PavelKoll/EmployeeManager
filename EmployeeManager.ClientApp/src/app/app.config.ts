import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideApi } from './core/api/generated/provide-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),

    // důležité: basePath = '' => requesty budou na /api/...
    // provideApi(''),
    provideApi('https://kollin-employeemanager-api.azurewebsites.net'),
  ],
};