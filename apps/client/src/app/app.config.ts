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
import { untilDestroyed } from '@ngneat/until-destroy';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyNgZorroAntdModule } from '@ngx-formly/ng-zorro-antd';
import {
  DynamicCrudGridComponent,
  provideRuckenAfatEngine,
} from '@rucken/engine-afat';
import {
  CreateSsoProjectDtoInterface,
  RuckenRestSdkAngularModule,
  RuckenRestSdkAngularService,
  SsoEmailTemplateScalarFieldEnumInterface,
  SsoProjectScalarFieldEnumInterface,
  SsoRoleInterface,
  SsoUserScalarFieldEnumInterface,
  UpdateSsoEmailTemplateDtoInterface,
  UpdateSsoProjectDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import {
  SsoEmailTemplateService,
  SsoInviteMembersFormComponent,
  SsoProjectService,
  SsoUserModel,
  SsoUserService,
} from '@rucken/sso-afat';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { map, of, tap } from 'rxjs';
import { serverUrl } from '../environments/environment';
import { AppInitializer } from './app-initializer';
import { AppTitleStrategy } from './app-title.strategy';
import { APP_TITLE } from './app.constants';
import { AppErrorHandler } from './app.error-handler';
import { provideSsoConfiguration } from './integrations/sso.configuration';
import { TranslocoHttpLoader } from './integrations/transloco-http.loader';
import { HomeComponent } from './pages/home/home.component';
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
          ssoProjectService: SsoProjectService,
          ssoEmailTemplateService: SsoEmailTemplateService,
          ruckenRestSdkAngularService: RuckenRestSdkAngularService,
          ssoUserService: SsoUserService,
        ) => {
          let cachedRoles: string[];
          function getRoles() {
            if (cachedRoles) {
              return of(cachedRoles);
            }
            return ruckenRestSdkAngularService
              .getSsoApi()
              .ssoRolesControllerFindMany()
              .pipe(
                map((data) => {
                  cachedRoles = data.userAvailableRoles;
                  return cachedRoles;
                }),
              );
          }
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
                  navigation: {
                    link: '/home1',
                    title: 'Home1',
                  },
                  crud: {
                    handlers: () => ({
                      updateOne: (id, data) => {
                        return ssoUserService.updateOne(
                          id,
                          data as SsoUserModel,
                        );
                      },
                      findOne: (id) => {
                        return ssoUserService.findOne(id);
                      },
                      findMany({ filters, meta }) {
                        return ssoUserService.findMany({
                          filters,
                          meta,
                        });
                      },
                    }),
                    form: () => ({
                      inputs: [
                        {
                          key: SsoUserScalarFieldEnumInterface.appData,
                          type: 'textarea',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.app-data`,
                            ),
                            placeholder: 'appData',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.birthdate,
                          type: 'date-input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.birthdate`,
                            ),
                            placeholder: 'birthdate',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.email,
                          type: 'input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.email`,
                            ),
                            placeholder: 'email',
                            required: true,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.emailVerifiedAt,
                          type: 'date-input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.email-verified-at`,
                            ),
                            placeholder: 'emailVerifiedAt',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.firstname,
                          type: 'input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.firstname`,
                            ),
                            placeholder: 'firstname',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.gender,
                          type: 'select',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.gender`,
                            ),
                            placeholder: 'gender',
                            required: false,
                            options: [
                              {
                                value: 'm',
                                label: translocoService.translate('Male'),
                              },
                              {
                                value: 'f',
                                label: translocoService.translate('Female'),
                              },
                            ],
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.lastname,
                          type: 'input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.lastname`,
                            ),
                            placeholder: 'lastname',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.phone,
                          type: 'input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.phone`,
                            ),
                            placeholder: 'phone',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.phoneVerifiedAt,
                          type: 'date-input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.phone-verified-at`,
                            ),
                            placeholder: 'phoneVerifiedAt',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.picture,
                          type: 'image-file',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.picture`,
                            ),
                            placeholder: 'picture',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.revokedAt,
                          type: 'date-input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.revoked-at`,
                            ),
                            placeholder: 'revokedAt',
                            required: false,
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.roles,
                          type: 'select',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.roles`,
                            ),
                            placeholder: 'roles',
                            required: false,
                            multiple: true,
                            options: getRoles().pipe(
                              map((roles) =>
                                roles.map((role) => ({
                                  value: role,
                                  label: role,
                                })),
                              ),
                            ),
                          },
                        },
                        {
                          key: SsoUserScalarFieldEnumInterface.username,
                          type: 'input',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-user.form.fields.username`,
                            ),
                            placeholder: 'username',
                            required: false,
                          },
                        },
                      ],
                    }),
                    grid: () => ({
                      actions: {
                        create: {
                          buttonTitle: marker('Invite Members'),
                          title: marker('sso-user.invite-members-modal.title'),
                          showModal: (grid: DynamicCrudGridComponent) => {
                            const modal = grid.nzModalService.create<
                              SsoInviteMembersFormComponent,
                              SsoInviteMembersFormComponent
                            >({
                              nzTitle: translocoService.translate(
                                'sso-user.invite-members-modal.title',
                              ),
                              nzContent: SsoInviteMembersFormComponent,
                              nzViewContainerRef: grid.viewContainerRef,
                              nzData: {
                                hideButtons: true,
                              } as SsoInviteMembersFormComponent,
                              nzFooter: [
                                {
                                  label: translocoService.translate('Cancel'),
                                  onClick: () => {
                                    modal.close();
                                  },
                                },
                                {
                                  label: translocoService.translate(
                                    'Send invitation links',
                                  ),
                                  onClick: () => {
                                    modal.componentInstance?.afterSendInvitationLinks
                                      .pipe(
                                        tap(() => {
                                          modal.close();
                                          grid.loadMany({ force: true });
                                        }),
                                        untilDestroyed(modal.componentInstance),
                                      )
                                      .subscribe();

                                    modal.componentInstance?.submitForm();
                                  },
                                  type: 'primary',
                                },
                              ],
                            });
                          },
                        },
                        update: {
                          title: marker('sso-user.update-modal.title'),
                        },
                      },
                      columns: [
                        {
                          name: SsoUserScalarFieldEnumInterface.id,
                          title: marker('sso-user.grid.columns.id'),
                        },
                        {
                          name: SsoUserScalarFieldEnumInterface.email,
                          title: marker('sso-user.grid.columns.email'),
                        },
                        {
                          name: SsoUserScalarFieldEnumInterface.firstname,
                          title: marker('sso-user.grid.columns.firstname'),
                        },
                        {
                          name: SsoUserScalarFieldEnumInterface.gender,
                          title: marker('sso-user.grid.columns.gender'),
                        },
                        {
                          name: SsoUserScalarFieldEnumInterface.phone,
                          title: marker('sso-user.grid.columns.phone'),
                        },
                        {
                          name: SsoUserScalarFieldEnumInterface.picture,
                          title: marker('sso-user.grid.columns.picture'),
                          isFile: true,
                        },
                        {
                          name: SsoUserScalarFieldEnumInterface.roles,
                          title: marker('sso-user.grid.columns.roles'),
                        },
                        {
                          name: SsoUserScalarFieldEnumInterface.username,
                          title: marker('sso-user.grid.columns.username'),
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
                  crud: {
                    handlers: () => ({
                      updateOne: (id, data) => {
                        return ssoEmailTemplateService.updateOne(
                          id,
                          data as UpdateSsoEmailTemplateDtoInterface,
                        );
                      },
                      findOne: (id) => {
                        return ssoEmailTemplateService.findOne(id);
                      },
                      findMany({ filters, meta }) {
                        return ssoEmailTemplateService.findMany({
                          filters,
                          meta,
                        });
                      },
                    }),
                    form: () => ({
                      inputs: [
                        {
                          key: SsoEmailTemplateScalarFieldEnumInterface.operationName,
                          type: 'input',
                          validation: {
                            show: true,
                          },
                          props: {
                            readonly: true,
                            disabled: true,
                            label: translocoService.translate(
                              `sso-email-template.form.fields.operation-name`,
                            ),
                            placeholder: 'operationName',
                          },
                        },
                        ...translocoService.getAvailableLangs().map((a) => ({
                          key:
                            a.id === translocoService.getDefaultLang()
                              ? 'subject'
                              : `subject_${a.id}`,
                          type: 'textarea',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-email-template.form.fields.subject-locale`,
                              // id, label
                              {
                                locale: a.id,
                                label: translocoService.translate(a.label),
                              },
                            ),
                            placeholder:
                              a.id === translocoService.getDefaultLang()
                                ? 'subject'
                                : `subject ${a.id}`,
                            required:
                              a.id === translocoService.getDefaultLang(),
                          },
                        })),
                        ...translocoService.getAvailableLangs().map((a) => ({
                          key:
                            a.id === translocoService.getDefaultLang()
                              ? 'html'
                              : `html_${a.id}`,
                          type: 'textarea',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-email-template.form.fields.html-locale`,
                              // id, label
                              {
                                locale: a.id,
                                label: translocoService.translate(a.label),
                              },
                            ),
                            placeholder:
                              a.id === translocoService.getDefaultLang()
                                ? 'html'
                                : `html ${a.id}`,
                            required:
                              a.id === translocoService.getDefaultLang(),
                          },
                        })),
                        ...translocoService.getAvailableLangs().map((a) => ({
                          key:
                            a.id === translocoService.getDefaultLang()
                              ? 'text'
                              : `text_${a.id}`,
                          type: 'textarea',
                          validation: {
                            show: true,
                          },
                          props: {
                            label: translocoService.translate(
                              `sso-email-template.form.fields.text-locale`,
                              // id, label
                              {
                                locale: a.id,
                                label: translocoService.translate(a.label),
                              },
                            ),
                            placeholder:
                              a.id === translocoService.getDefaultLang()
                                ? 'text'
                                : `text ${a.id}`,
                            required:
                              a.id === translocoService.getDefaultLang(),
                          },
                        })),
                      ],
                    }),
                    grid: () => ({
                      title: marker('Email templates'),
                      actions: {
                        update: {
                          title: marker(
                            'sso-email-template.update-modal.title',
                          ),
                          width: '700px',
                        },
                      },
                      columns: [
                        {
                          name: SsoEmailTemplateScalarFieldEnumInterface.id,
                          title: marker('sso-email-template.grid.columns.id'),
                        },
                        {
                          name: SsoEmailTemplateScalarFieldEnumInterface.operationName,
                          title: marker(
                            'sso-email-template.grid.columns.operation-name',
                          ),
                        },
                        {
                          name: SsoEmailTemplateScalarFieldEnumInterface.subject,
                          title: marker(
                            'sso-email-template.grid.columns.subject',
                          ),
                        },
                        {
                          name: SsoEmailTemplateScalarFieldEnumInterface.text,
                          title: marker('sso-email-template.grid.columns.text'),
                        },
                      ],
                    }),
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
                          data as CreateSsoProjectDtoInterface,
                        );
                      },
                      updateOne: (id, data) => {
                        return ssoProjectService.updateOne(
                          id,
                          data as UpdateSsoProjectDtoInterface,
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
                              },
                            ),
                            placeholder:
                              a.id === translocoService.getDefaultLang()
                                ? 'name'
                                : `name ${a.id}`,
                            required:
                              a.id === translocoService.getDefaultLang(),
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
                              `sso-project.form.fields.client-id`,
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
                              `sso-project.form.fields.client-secret`,
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
                              `sso-project.form.fields.public`,
                            ),
                            placeholder: 'public',
                            required: true,
                          },
                        },
                      ],
                    }),
                    grid: () => ({
                      actions: {
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
                          title: marker(
                            'sso-project.grid.columns.client-secret',
                          ),
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
          };
        },
        [
          TranslocoService,
          SsoProjectService,
          SsoEmailTemplateService,
          RuckenRestSdkAngularService,
          SsoUserService,
        ],
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
