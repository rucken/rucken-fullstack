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
import { provideTransloco } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { COMMON_FORMLY_FIELDS } from '@nestjs-mod/afat';
import {
  FILES_FORMLY_FIELDS,
  FilesRestSdkAngularModule,
  MINIO_URL,
} from '@nestjs-mod/files-afat';
import { WebhookRestSdkAngularModule } from '@nestjs-mod/webhook-afat';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyNgZorroAntdModule } from '@ngx-formly/ng-zorro-antd';
import { ROOT_PATH_MARKER, RuckenAfatEngineModule } from '@rucken/engine-afat';
import {
  RuckenRestSdkAngularModule,
  SsoRoleInterface,
} from '@rucken/rucken-rest-sdk-angular';
import {
  OnActivateOptions,
  SSO_GUARD_DATA_ROUTE_KEY,
  SsoGuardData,
  SsoGuardService,
} from '@rucken/sso-afat';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { serverUrl } from '../environments/environment';
import { AppInitializer } from './app-initializer';
import { AppTitleStrategy } from './app-title.strategy';
import { APP_TITLE } from './app.constants';
import { AppErrorHandler } from './app.error-handler';
import { provideSsoConfiguration } from './integrations/sso.configuration';
import { TranslocoHttpLoader } from './integrations/transloco-http.loader';
import { HomeComponent } from './pages/home/home.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { UsersComponent } from './pages/users/users.component';
import { WebhooksComponent } from './pages/webhooks/webhooks.component';

export const ssoAppConfig = ({
  minioURL,
}: {
  minioURL: string;
}): ApplicationConfig => {
  return {
    providers: [
      provideNzIcons([GithubFill]),
      provideClientHydration(),
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideHttpClient(),
      provideNzI18n(en_US),
      importProvidersFrom(
        BrowserAnimationsModule,
        RuckenAfatEngineModule.forRoot({
          layoutConfiguration: {
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
                navigation: {
                  link: '/webhooks',
                  roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                  title: marker('Webhooks'),
                },
                route: {
                  path: 'webhooks',
                  component: WebhooksComponent,
                  title: marker('Webhooks'),
                  canActivate: [SsoGuardService],
                  data: {
                    [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
                      roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                      afterActivate: async (options: OnActivateOptions) => {
                        if (options.error) {
                          options.router.navigate([ROOT_PATH_MARKER]);
                          return false;
                        }
                        return true;
                      },
                    }),
                  },
                },
              },
              {
                navigation: {
                  link: '/templates',
                  roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                  title: marker('Templates'),
                },
                route: {
                  path: 'templates',
                  title: marker('Templates'),
                  component: TemplatesComponent,
                  canActivate: [SsoGuardService],
                  data: {
                    [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
                      roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                      afterActivate: async (options: OnActivateOptions) => {
                        if (options.error) {
                          options.router.navigate([ROOT_PATH_MARKER]);
                          return false;
                        }
                        return true;
                      },
                    }),
                  },
                },
              },
              {
                navigation: {
                  link: '/users',
                  roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                  title: marker('Users'),
                },
                route: {
                  path: 'users',
                  component: UsersComponent,
                  title: marker('Users'),
                  canActivate: [SsoGuardService],
                  data: {
                    [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
                      roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                      afterActivate: async (options: OnActivateOptions) => {
                        if (options.error) {
                          options.router.navigate([ROOT_PATH_MARKER]);
                          return false;
                        }
                        return true;
                      },
                    }),
                  },
                },
              },
              {
                second: true,
                navigation: {
                  link: '/projects',
                  roles: [SsoRoleInterface.admin],
                  title: marker('Projects'),
                },
                route: {
                  path: 'projects',
                  component: ProjectsComponent,
                  title: marker('Projects'),
                  canActivate: [SsoGuardService],
                  data: {
                    [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
                      roles: [SsoRoleInterface.admin],
                      afterActivate: async (options: OnActivateOptions) => {
                        if (options.error) {
                          options.router.navigate([ROOT_PATH_MARKER]);
                          return false;
                        }
                        return true;
                      },
                    }),
                  },
                },
              },
              {
                navigation: {
                  href: 'https://github.com/rucken/rucken-fullstack',
                  icon: 'github',
                  title: marker('Source code'),
                },
              },
            ],
          },
        }),
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
        FormlyNgZorroAntdModule
      ),
      { provide: ErrorHandler, useClass: AppErrorHandler },
      {
        provide: MINIO_URL,
        useValue: minioURL,
      },
      provideSsoConfiguration(),
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
