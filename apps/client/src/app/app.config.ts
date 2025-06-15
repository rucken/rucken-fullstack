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
import {
  LangDefinition,
  provideTransloco,
  TranslocoService,
} from '@jsverse/transloco';
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
import { provideRuckenAfatEngine } from '@rucken/engine-afat';
import {
  CreateSsoProjectDtoInterface,
  RuckenRestSdkAngularModule,
  SsoProjectScalarFieldEnumInterface,
  SsoRoleInterface,
  UpdateSsoProjectDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { SsoProjectService } from '@rucken/sso-afat';
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
      provideRuckenAfatEngine(
        (
          translocoService: TranslocoService,
          ssoProjectService: SsoProjectService
        ) => ({
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
                hidden: true,
                navigation: {
                  link: '/home1',
                  title: 'Home1',
                },
                crud: {
                  handlers: () => ({
                    createOne: (data) => {
                      return ssoProjectService.createOne(
                        data as CreateSsoProjectDtoInterface
                      );
                    },
                    updateOne: (id, data) => {
                      return ssoProjectService.updateOne(
                        id,
                        data as UpdateSsoProjectDtoInterface
                      );
                    },
                    findOne: (id) => {
                      return ssoProjectService.findOne(id);
                    },
                    deleteOne(id) {
                      return ssoProjectService.deleteOne(id);
                    },
                    findMany({ filters, meta }) {
                      return ssoProjectService.findMany({ filters, meta });
                    },
                  }),
                  form: () => ({
                    inputs: [
                      ...(
                        translocoService.getAvailableLangs() as LangDefinition[]
                      ).map((a) => ({
                        key:
                          a.id === translocoService.getDefaultLang()
                            ? 'name'
                            : `name_${a.id}`,
                        type: 'textarea',
                        validation: {
                          show: true,
                        },
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.name-locale`,
                            // id, label
                            {
                              locale: a.id,
                              label: translocoService.translate(a.label),
                            }
                          ),
                          placeholder:
                            a.id === translocoService.getDefaultLang()
                              ? 'name'
                              : `name ${a.id}`,
                          required: a.id === translocoService.getDefaultLang(),
                        },
                      })),
                      {
                        key: SsoProjectScalarFieldEnumInterface.clientId,
                        type: 'input',
                        validation: {
                          show: true,
                        },
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.client-id`
                          ),
                          placeholder: 'clientId',
                          required: true,
                        },
                      },
                      {
                        key: SsoProjectScalarFieldEnumInterface.clientSecret,
                        type: 'input',
                        validation: {
                          show: true,
                        },
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.client-secret`
                          ),
                          placeholder: 'clientSecret',
                          required: true,
                        },
                      },
                      {
                        key: SsoProjectScalarFieldEnumInterface.public,
                        type: 'checkbox',
                        validation: {
                          show: true,
                        },
                        defaultValue: false,
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.public`
                          ),
                          placeholder: 'public',
                          required: true,
                        },
                      },
                    ],
                  }),
                  grid: () => ({
                    modals: {
                      create: {
                        title: marker('sso-project.create-modal.title'),
                      },
                      delete: {
                        title: marker('sso-project.delete-modal.title'),
                      },
                      update: {
                        title: marker('sso-project.update-modal.title'),
                      },
                    },
                    columns: [
                      {
                        name: SsoProjectScalarFieldEnumInterface.id,
                        title: marker('sso-project.grid.columns.id'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.name,
                        title: marker('sso-project.grid.columns.name'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.clientId,
                        title: marker('sso-project.grid.columns.client-id'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.clientSecret,
                        title: marker('sso-project.grid.columns.client-secret'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.public,
                        title: marker('sso-project.grid.columns.public'),
                      },
                    ],
                  }),
                },
              },
              {
                roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                navigation: {
                  link: '/webhooks',
                  title: marker('Webhooks'),
                },
                route: {
                  component: WebhooksComponent,
                },
              },
              {
                roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                navigation: {
                  link: '/templates',
                  title: marker('Templates'),
                },
                route: {
                  component: TemplatesComponent,
                },
              },
              {
                roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
                navigation: {
                  link: '/users',
                  title: marker('Users'),
                },
                route: {
                  component: UsersComponent,
                },
              },
              {
                roles: [SsoRoleInterface.admin],
                second: true,
                navigation: {
                  link: '/projects',
                  title: marker('Projects'),
                },
                crud: {
                  handlers: () => ({
                    createOne: (data) => {
                      return ssoProjectService.createOne(
                        data as CreateSsoProjectDtoInterface
                      );
                    },
                    updateOne: (id, data) => {
                      return ssoProjectService.updateOne(
                        id,
                        data as UpdateSsoProjectDtoInterface
                      );
                    },
                    findOne: (id) => {
                      return ssoProjectService.findOne(id);
                    },
                    deleteOne(id) {
                      return ssoProjectService.deleteOne(id);
                    },
                    findMany({ filters, meta }) {
                      return ssoProjectService.findMany({ filters, meta });
                    },
                  }),
                  form: () => ({
                    inputs: [
                      ...(
                        translocoService.getAvailableLangs() as LangDefinition[]
                      ).map((a) => ({
                        key:
                          a.id === translocoService.getDefaultLang()
                            ? 'name'
                            : `name_${a.id}`,
                        type: 'textarea',
                        validation: {
                          show: true,
                        },
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.name-locale`,
                            // id, label
                            {
                              locale: a.id,
                              label: translocoService.translate(a.label),
                            }
                          ),
                          placeholder:
                            a.id === translocoService.getDefaultLang()
                              ? 'name'
                              : `name ${a.id}`,
                          required: a.id === translocoService.getDefaultLang(),
                        },
                      })),
                      {
                        key: SsoProjectScalarFieldEnumInterface.clientId,
                        type: 'input',
                        validation: {
                          show: true,
                        },
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.client-id`
                          ),
                          placeholder: 'clientId',
                          required: true,
                        },
                      },
                      {
                        key: SsoProjectScalarFieldEnumInterface.clientSecret,
                        type: 'input',
                        validation: {
                          show: true,
                        },
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.client-secret`
                          ),
                          placeholder: 'clientSecret',
                          required: true,
                        },
                      },
                      {
                        key: SsoProjectScalarFieldEnumInterface.public,
                        type: 'checkbox',
                        validation: {
                          show: true,
                        },
                        defaultValue: false,
                        props: {
                          label: translocoService.translate(
                            `sso-project.form.fields.public`
                          ),
                          placeholder: 'public',
                          required: true,
                        },
                      },
                    ],
                  }),
                  grid: () => ({
                    modals: {
                      create: {
                        title: marker('sso-project.create-modal.title'),
                      },
                      delete: {
                        title: marker('sso-project.delete-modal.title'),
                      },
                      update: {
                        title: marker('sso-project.update-modal.title'),
                      },
                    },
                    columns: [
                      {
                        name: SsoProjectScalarFieldEnumInterface.id,
                        title: marker('sso-project.grid.columns.id'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.name,
                        title: marker('sso-project.grid.columns.name'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.clientId,
                        title: marker('sso-project.grid.columns.client-id'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.clientSecret,
                        title: marker('sso-project.grid.columns.client-secret'),
                      },
                      {
                        name: SsoProjectScalarFieldEnumInterface.public,
                        title: marker('sso-project.grid.columns.public'),
                      },
                    ],
                  }),
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
        [TranslocoService, SsoProjectService]
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
