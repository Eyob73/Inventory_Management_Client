import { ApplicationConfig, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withXhr,
  withXsrfConfiguration,
} from '@angular/common/http';
import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './core/transloco-loader';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginatorIntl } from './core/custom-paginator-intl';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, errorInterceptor, jwtInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withXhr(),
    ),
    provideAnimations(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl },
    provideTransloco({
      config: {
        availableLangs: ['en', 'am', 'om'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: false /* disabled temporarily to avoid 404 */,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
