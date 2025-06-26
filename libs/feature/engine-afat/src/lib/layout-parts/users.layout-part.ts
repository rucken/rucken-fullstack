import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { RequestMeta } from '@nestjs-mod/misc';
import { untilDestroyed } from '@ngneat/until-destroy';
import { DynamicCrudGridComponent } from '../dynamic-grids/dynamic-crud-grid/dynamic-crud-grid.component';
import { LayoutPart } from '../layout/layout.configuration';
import {
  RuckenRestSdkAngularService,
  SendInvitationLinksArgsInterface,
  SsoRefreshSessionDtoInterface,
  SsoRefreshSessionScalarFieldEnumInterface,
  SsoRoleInterface,
  SsoUserScalarFieldEnumInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { map, mergeMap, of, tap } from 'rxjs';

import { TIMEZONE_OFFSET, safeParseJson } from '@nestjs-mod/misc';
import { SsoUserDtoInterface } from '@rucken/rucken-rest-sdk-angular';

import { FilesService } from '@nestjs-mod/files-afat';
import { addHours, format } from 'date-fns';
import { SsoInviteMembersFormComponent } from '../forms/sso-invite-members-form/sso-invite-members-form.component';

export interface SsoSessionModel
  extends Partial<Omit<SsoRefreshSessionDtoInterface, 'createdAt' | 'updatedAt' | 'userData' | 'expiresAt'>> {
  userData?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  expiresAt?: Date | null;
}

export interface SsoUserModel
  extends Partial<
    Omit<
      SsoUserDtoInterface,
      | 'revokedAt'
      | 'emailVerifiedAt'
      | 'phoneVerifiedAt'
      | 'birthdate'
      | 'createdAt'
      | 'updatedAt'
      | 'appData'
      | 'roles'
    >
  > {
  roles: string[];
  appData?: string | null;
  revokedAt?: Date | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  birthdate?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export function usersLayoutPart(
  ruckenRestSdkAngularService: RuckenRestSdkAngularService,
  translocoService: TranslocoService,
  filesService: FilesService,
): LayoutPart {
  let cachedRoles: string[];
  let userId: string;
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

  //

  const toModel = (item?: SsoUserDtoInterface): SsoUserModel => {
    return {
      ...item,
      roles: item?.roles ? item.roles.split(',') : [],
      appData: item?.appData ? JSON.stringify(item.appData) : '',
      revokedAt: item?.revokedAt ? addHours(new Date(item.revokedAt), TIMEZONE_OFFSET) : null,
      emailVerifiedAt: item?.emailVerifiedAt ? addHours(new Date(item.emailVerifiedAt), TIMEZONE_OFFSET) : null,
      phoneVerifiedAt: item?.phoneVerifiedAt ? addHours(new Date(item.phoneVerifiedAt), TIMEZONE_OFFSET) : null,
      birthdate: item?.birthdate ? addHours(new Date(item.birthdate), TIMEZONE_OFFSET) : null,
      createdAt: item?.createdAt ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET) : null,
      updatedAt: item?.updatedAt ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET) : null,
    };
  };

  const toForm = (model: SsoUserModel) => {
    return {
      ...model,
      revokedAt: model.revokedAt ? format(model.revokedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      emailVerifiedAt: model.emailVerifiedAt ? format(model.emailVerifiedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      phoneVerifiedAt: model.phoneVerifiedAt ? format(model.phoneVerifiedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      birthdate: model.birthdate ? format(model.birthdate, 'yyyy-MM-dd HH:mm:ss') : null,
    };
  };

  const toJson = (data: SsoUserModel) => {
    return {
      email: data.email || '',
      phone: data.phone || '',
      username: data.username || '',
      roles: data.roles.length ? data.roles.join(',') : '',
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      gender: data.gender || '',
      birthdate: data.birthdate ? format(new Date(data.birthdate), 'yyyy-MM-dd HH:mm:ss') : undefined,
      picture: data.picture || '',
      appData: data.appData ? safeParseJson(data.appData) : null,
      revokedAt: data.revokedAt ? format(new Date(data.revokedAt), 'yyyy-MM-dd HH:mm:ss') : undefined,
      emailVerifiedAt: data.emailVerifiedAt ? format(new Date(data.emailVerifiedAt), 'yyyy-MM-dd HH:mm:ss') : undefined,
      phoneVerifiedAt: data.phoneVerifiedAt ? format(new Date(data.phoneVerifiedAt), 'yyyy-MM-dd HH:mm:ss') : undefined,
    };
  };

  const sendInvitationLinks = (data: SendInvitationLinksArgsInterface) => {
    return ruckenRestSdkAngularService.getSsoApi().ssoUsersControllerSendInvitationLinks(data);
  };

  //

  const toSessionModel = (item?: SsoRefreshSessionDtoInterface): SsoSessionModel => {
    return {
      ...item,
      userData: item?.userData ? JSON.stringify(item.userData) : '',
      expiresAt: item?.expiresAt ? addHours(new Date(item.expiresAt), TIMEZONE_OFFSET) : null,
      createdAt: item?.createdAt ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET) : null,
      updatedAt: item?.updatedAt ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET) : null,
    };
  };

  const toSessionJson = (data: SsoSessionModel) => {
    return {
      userData: data.userData ? safeParseJson(data.userData) : null,
      userAgent: data.userAgent || '',
      userIp: data.userIp || '',
      expiresAt: data.expiresAt ? format(new Date(data.expiresAt), 'yyyy-MM-dd HH:mm:ss') : undefined,
      enabled: data.enabled === true,
    };
  };

  return {
    roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
    navigation: {
      link: '/users',
      title: marker('Users'),
    },
    crud: {
      handlers: () => ({
        findOne(id: string) {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoUsersControllerFindOne(id)
            .pipe(map((u) => toForm(toModel(u))));
        },

        findMany({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoUsersControllerFindMany(
              meta?.curPage,
              meta?.perPage,
              filters['search'],
              meta?.sort
                ? Object.entries(meta?.sort)
                    .map(([key, value]) => `${key}:${value}`)
                    .join(',')
                : undefined,
              filters['projectId'],
            )
            .pipe(
              map(({ meta, ssoUsers }) => ({
                meta,
                items: ssoUsers.map((p) => toModel(p)),
              })),
            );
        },

        updateOne(id: string, data: SsoUserModel) {
          const oldData = data;
          return (data.picture ? filesService.getPresignedUrlAndUploadFile(data.picture) : of('')).pipe(
            mergeMap((picture) =>
              ruckenRestSdkAngularService.getSsoApi().ssoUsersControllerUpdateOne(id, toJson({ ...data, picture })),
            ),
            mergeMap((newData) => {
              if (oldData.picture && typeof oldData.picture === 'string' && newData.picture !== oldData.picture) {
                return filesService.deleteFile(oldData.picture).pipe(map(() => newData));
              }
              return of(newData);
            }),
            map((p) => toModel(p)),
          );
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
              label: translocoService.translate(`sso-user.form.fields.app-data`),
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
              label: translocoService.translate(`sso-user.form.fields.birthdate`),
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
              label: translocoService.translate(`sso-user.form.fields.email`),
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
              label: translocoService.translate(`sso-user.form.fields.email-verified-at`),
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
              label: translocoService.translate(`sso-user.form.fields.firstname`),
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
              label: translocoService.translate(`sso-user.form.fields.gender`),
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
              label: translocoService.translate(`sso-user.form.fields.lastname`),
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
              label: translocoService.translate(`sso-user.form.fields.phone`),
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
              label: translocoService.translate(`sso-user.form.fields.phone-verified-at`),
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
              label: translocoService.translate(`sso-user.form.fields.picture`),
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
              label: translocoService.translate(`sso-user.form.fields.revoked-at`),
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
              label: translocoService.translate(`sso-user.form.fields.roles`),
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
              label: translocoService.translate(`sso-user.form.fields.username`),
              placeholder: 'username',
              required: false,
            },
          },
        ],
      }),
      grid: () => ({
        handlers: {
          selectOne(grid, id) {
            userId = id;
          },
        },
        actions: {
          create: {
            buttonTitle: marker('Invite Members'),
            title: marker('sso-user.invite-members-modal.title'),
            showModal: (grid: DynamicCrudGridComponent) => {
              const modal = grid.nzModalService.create<SsoInviteMembersFormComponent, SsoInviteMembersFormComponent>({
                nzTitle: translocoService.translate('sso-user.invite-members-modal.title'),
                nzContent: SsoInviteMembersFormComponent,
                nzViewContainerRef: grid.viewContainerRef,
                nzData: {
                  hideButtons: true,
                  sendInvitationLinks: (emails) => sendInvitationLinks({ emails }),
                } as SsoInviteMembersFormComponent,
                nzFooter: [
                  {
                    label: translocoService.translate('Cancel'),
                    onClick: () => {
                      modal.close();
                    },
                  },
                  {
                    label: translocoService.translate('Send invitation links'),
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
    relatedCrud: {
      handlers: () => ({
        findOne(id: string) {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoRefreshSessionsControllerFindOne(id)
            .pipe(map((s) => toSessionModel(s)));
        },

        findMany({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoRefreshSessionsControllerFindMany(
              filters['userId'],
              meta?.curPage,
              meta?.perPage,
              filters['search'],
              meta?.sort
                ? Object.entries(meta?.sort)
                    .map(([key, value]) => `${key}:${value}`)
                    .join(',')
                : undefined,
            )
            .pipe(
              map(({ meta, ssoRefreshSessions }) => ({
                meta,
                items: ssoRefreshSessions.map((t) => toSessionModel(t)),
              })),
            );
        },

        updateOne(id: string, data: SsoSessionModel) {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoRefreshSessionsControllerUpdateOne(id, toSessionJson(data))
            .pipe(map((s) => toSessionModel(s)));
        },
      }),
      form: () => ({
        inputs: [
          {
            key: SsoRefreshSessionScalarFieldEnumInterface.enabled,
            type: 'checkbox',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`sso-session.form.fields.enabled`),
              placeholder: 'enabled',
              required: true,
            },
          },
          {
            key: SsoRefreshSessionScalarFieldEnumInterface.expiresAt,
            type: 'date-input',
            validation: {
              show: true,
            },
            props: {
              type: 'number',
              label: translocoService.translate(`sso-session.form.fields.expires-at`),
              placeholder: 'expiresAt',
              required: false,
            },
          },
          {
            key: SsoRefreshSessionScalarFieldEnumInterface.fingerprint,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`sso-session.form.fields.fingerprint`),
              placeholder: 'fingerprint',
              required: false,
            },
          },
          {
            key: SsoRefreshSessionScalarFieldEnumInterface.userAgent,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`sso-session.form.fields.user-agent`),
              placeholder: 'userAgent',
              required: false,
            },
          },
          {
            key: SsoRefreshSessionScalarFieldEnumInterface.userData,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`sso-session.form.fields.user-data`),
              placeholder: 'userData',
              required: false,
            },
          },
          {
            key: SsoRefreshSessionScalarFieldEnumInterface.userIp,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`sso-session.form.fields.user-ip`),
              placeholder: 'userIp',
              required: false,
            },
          },
        ],
      }),
      grid: () => ({
        title: translocoService.translate('Sessions for user #{{userId}}', {
          userId,
        }),
        actions: {
          update: {
            title: marker('sso-session.update-modal.title'),
          },
        },
        columns: [
          {
            name: SsoRefreshSessionScalarFieldEnumInterface.id,
            title: marker('sso-session.grid.columns.id'),
          },
          {
            name: SsoRefreshSessionScalarFieldEnumInterface.userAgent,
            title: marker('sso-session.grid.columns.user-agent'),
          },
          {
            name: SsoRefreshSessionScalarFieldEnumInterface.fingerprint,
            title: marker('sso-session.grid.columns.fingerprint'),
          },
          {
            name: SsoRefreshSessionScalarFieldEnumInterface.userIp,
            title: marker('sso-session.grid.columns.user-ip'),
          },
          {
            name: SsoRefreshSessionScalarFieldEnumInterface.expiresAt,
            title: marker('sso-session.grid.columns.expires-at'),
          },
          {
            name: SsoRefreshSessionScalarFieldEnumInterface.userData,
            title: marker('sso-session.grid.columns.user-data'),
          },
          {
            name: SsoRefreshSessionScalarFieldEnumInterface.enabled,
            title: marker('sso-session.grid.columns.enabled'),
          },
        ],
      }),
    },
  };
}
