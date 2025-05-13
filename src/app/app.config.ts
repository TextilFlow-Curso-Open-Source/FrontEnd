import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideTranslateService, TranslateLoader} from '@ngx-translate/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {HttpClient, provideHttpClient} from '@angular/common/http';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';

const httpLoaderFactory: (http: HttpClient) =>
  TranslateLoader = (http: HttpClient) =>
  new TranslateHttpLoader(http, './assets/i18n/', '.json');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'es',
    })],
};
