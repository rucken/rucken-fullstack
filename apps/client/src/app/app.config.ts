import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { GithubFill } from '@ant-design/icons-angular/icons';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { COMMON_FORMLY_FIELDS } from '@nestjs-mod/afat';
import { FILES_FORMLY_FIELDS, FilesRestSdkAngularModule, FilesService, MINIO_URL } from '@nestjs-mod/files-afat';
import { WebhookRestSdkAngularModule } from '@nestjs-mod/webhook-afat';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyNgZorroAntdModule } from '@ngx-formly/ng-zorro-antd';
import {
  emailTemplatesLayoutPart,
  projectsLayoutPart,
  provideRuckenAfatEngine,
  usersLayoutPart,
} from '@rucken/engine-afat';
import {
  RuckenRestSdkAngularModule,
  RuckenRestSdkAngularService,
  EngineRoleInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { serverUrl } from '../environments/environment';
import { AppInitializer } from './app-initializer';
import { AppTitleStrategy } from './app-title.strategy';
import { APP_TITLE } from './app.constants';
import { AppErrorHandler } from './app.error-handler';
import { provideEngineConfiguration } from './integrations/engine.configuration';
import { TranslocoHttpLoader } from './integrations/transloco-http.loader';
import { HomeComponent } from './pages/home/home.component';
import { WebhooksComponent } from './pages/webhooks/webhooks.component';

export const engineAppConfig = ({ minioURL }: { minioURL: string }): ApplicationConfig => {
  return {
    providers: [
      provideNzIcons([GithubFill]),
      provideClientHydration(),
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideHttpClient(),
      provideNzI18n(en_US),
      provideRuckenAfatEngine(
        (
          translocoService: TranslocoService,
          ruckenRestSdkAngularService: RuckenRestSdkAngularService,
          filesService: FilesService,
        ) => {
          return {
            layout: {
              title: APP_TITLE,
              parts: [
                {
                  root: true,
                  navigation: {
                    link: '/home',
                    title: marker('Home'),
                  },
                  route: {
                    path: 'home',
                    component: HomeComponent,
                  },
                },
                {
                  roles: [EngineRoleInterface.manager, EngineRoleInterface.admin],
                  navigation: {
                    link: '/webhooks',
                    title: marker('Webhooks'),
                  },
                  route: {
                    component: WebhooksComponent,
                  },
                },
                emailTemplatesLayoutPart(ruckenRestSdkAngularService, translocoService),
                usersLayoutPart(ruckenRestSdkAngularService, translocoService, filesService),
                projectsLayoutPart(ruckenRestSdkAngularService, translocoService),
                {
                  navigation: {
                    href: 'https://github.com/rucken/rucken-fullstack',
                    icon: 'github',
                    title: marker('Source code'),
                  },
                },
              ],
            },
          };
        },
        [TranslocoService, RuckenRestSdkAngularService, FilesService],
      ),
      importProvidersFrom(
        BrowserAnimationsModule,
        RuckenRestSdkAngularModule.forRoot({
          basePath: serverUrl,
        }),
        FilesRestSdkAngularModule.forRoot({
          basePath: serverUrl,
        }),
        WebhookRestSdkAngularModule.forRoot({
          basePath: serverUrl,
        }),
        FormlyModule.forRoot({
          types: [...FILES_FORMLY_FIELDS, ...COMMON_FORMLY_FIELDS],
        }),
        FormlyNgZorroAntdModule,
      ),
      { provide: ErrorHandler, useClass: AppErrorHandler },
      {
        provide: MINIO_URL,
        useValue: minioURL,
      },
      provideEngineConfiguration(),
      // Transloco Config
      provideTransloco({
        config: {
          availableLangs: [
            {
              id: marker('en'),
              label: marker('app.locale.name.english'),
            },
            {
              id: marker('ru'),
              label: marker('app.locale.name.russian'),
            },
          ],
          defaultLang: 'en',
          fallbackLang: 'en',
          reRenderOnLangChange: true,
          prodMode: true,
          missingHandler: {
            logMissingKey: true,
            useFallbackTranslation: true,
            allowEmpty: true,
          },
        },
        loader: TranslocoHttpLoader,
      }),
      provideTranslocoLocale({
        defaultLocale: 'en-US',
        langToLocaleMapping: {
          en: 'en-US',
          ru: 'ru-RU',
        },
      }),
      provideTranslocoMessageformat({
        locales: ['en-US', 'ru-RU'],
      }),
      provideAppInitializer(() => {
        const initializerFn = (
          (appInitializer: AppInitializer) => () =>
            appInitializer.resolve()
        )(inject(AppInitializer));
        return initializerFn();
      }),
      {
        provide: TitleStrategy,
        useClass: AppTitleStrategy,
      },
    ],
  };
};
