import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { RequestMeta } from '@nestjs-mod/misc';
import { untilDestroyed } from '@ngneat/until-destroy';
import { DynamicCrudGridComponent } from '../dynamic-grids/dynamic-crud-grid/dynamic-crud-grid.component';
import { LayoutPart } from '../layout/layout.configuration';
import {
  RuckenRestSdkAngularService,
  SendInvitationLinksArgsInterface,
  EngineRefreshSessionDtoInterface,
  EngineRefreshSessionScalarFieldEnumInterface,
  EngineRoleInterface,
  EngineUserScalarFieldEnumInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { map, mergeMap, of, tap } from 'rxjs';

import { TIMEZONE_OFFSET, safeParseJson } from '@nestjs-mod/misc';
import { EngineUserDtoInterface } from '@rucken/rucken-rest-sdk-angular';

import { FilesService } from '@nestjs-mod/files-afat';
import { addHours, format } from 'date-fns';
import { EngineInviteMembersFormComponent } from '../forms/engine-invite-members-form/engine-invite-members-form.component';

export interface EngineSessionModel
  extends Partial<Omit<EngineRefreshSessionDtoInterface, 'createdAt' | 'updatedAt' | 'userData' | 'expiresAt'>> {
  userData?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  expiresAt?: Date | null;
}

export interface EngineUserModel
  extends Partial<
    Omit<
      EngineUserDtoInterface,
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
      .getEngineApi()
      .engineRolesControllerFindMany()
      .pipe(
        map((data) => {
          cachedRoles = data.userAvailableRoles;
          return cachedRoles;
        }),
      );
  }

  //

  const toModel = (item?: EngineUserDtoInterface): EngineUserModel => {
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

  const toForm = (model: EngineUserModel) => {
    return {
      ...model,
      revokedAt: model.revokedAt ? format(model.revokedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      emailVerifiedAt: model.emailVerifiedAt ? format(model.emailVerifiedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      phoneVerifiedAt: model.phoneVerifiedAt ? format(model.phoneVerifiedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      birthdate: model.birthdate ? format(model.birthdate, 'yyyy-MM-dd HH:mm:ss') : null,
    };
  };

  const toJson = (data: EngineUserModel) => {
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
    return ruckenRestSdkAngularService.getEngineApi().engineUsersControllerSendInvitationLinks(data);
  };

  //

  const toSessionModel = (item?: EngineRefreshSessionDtoInterface): EngineSessionModel => {
    return {
      ...item,
      userData: item?.userData ? JSON.stringify(item.userData) : '',
      expiresAt: item?.expiresAt ? addHours(new Date(item.expiresAt), TIMEZONE_OFFSET) : null,
      createdAt: item?.createdAt ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET) : null,
      updatedAt: item?.updatedAt ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET) : null,
    };
  };

  const toSessionJson = (data: EngineSessionModel) => {
    return {
      userData: data.userData ? safeParseJson(data.userData) : null,
      userAgent: data.userAgent || '',
      userIp: data.userIp || '',
      expiresAt: data.expiresAt ? format(new Date(data.expiresAt), 'yyyy-MM-dd HH:mm:ss') : undefined,
      enabled: data.enabled === true,
    };
  };

  return {
    roles: [EngineRoleInterface.manager, EngineRoleInterface.admin],
    navigation: {
      link: '/users',
      title: marker('Users'),
    },
    crud: {
      handlers: () => ({
        findOne(id: string) {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineUsersControllerFindOne(id)
            .pipe(map((u) => toForm(toModel(u))));
        },

        findMany({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineUsersControllerFindMany(
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
              map(({ meta, engineUsers }) => ({
                meta,
                items: engineUsers.map((p) => toModel(p)),
              })),
            );
        },

        updateOne(id: string, data: EngineUserModel) {
          const oldData = data;
          return (data.picture ? filesService.getPresignedUrlAndUploadFile(data.picture) : of('')).pipe(
            mergeMap((picture) =>
              ruckenRestSdkAngularService
                .getEngineApi()
                .engineUsersControllerUpdateOne(id, toJson({ ...data, picture })),
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
            key: EngineUserScalarFieldEnumInterface.appData,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.app-data`),
              placeholder: 'appData',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.birthdate,
            type: 'date-input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.birthdate`),
              placeholder: 'birthdate',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.email,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.email`),
              placeholder: 'email',
              required: true,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.emailVerifiedAt,
            type: 'date-input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.email-verified-at`),
              placeholder: 'emailVerifiedAt',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.firstname,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.firstname`),
              placeholder: 'firstname',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.gender,
            type: 'select',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.gender`),
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
            key: EngineUserScalarFieldEnumInterface.lastname,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.lastname`),
              placeholder: 'lastname',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.phone,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.phone`),
              placeholder: 'phone',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.phoneVerifiedAt,
            type: 'date-input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.phone-verified-at`),
              placeholder: 'phoneVerifiedAt',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.picture,
            type: 'image-file',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.picture`),
              placeholder: 'picture',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.revokedAt,
            type: 'date-input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.revoked-at`),
              placeholder: 'revokedAt',
              required: false,
            },
          },
          {
            key: EngineUserScalarFieldEnumInterface.roles,
            type: 'select',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.roles`),
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
            key: EngineUserScalarFieldEnumInterface.username,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-user.form.fields.username`),
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
            title: marker('engine-user.invite-members-modal.title'),
            showModal: (grid: DynamicCrudGridComponent) => {
              const modal = grid.nzModalService.create<
                EngineInviteMembersFormComponent,
                EngineInviteMembersFormComponent
              >({
                nzTitle: translocoService.translate('engine-user.invite-members-modal.title'),
                nzContent: EngineInviteMembersFormComponent,
                nzViewContainerRef: grid.viewContainerRef,
                nzData: {
                  hideButtons: true,
                  sendInvitationLinks: (emails) => sendInvitationLinks({ emails }),
                } as EngineInviteMembersFormComponent,
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
            title: marker('engine-user.update-modal.title'),
          },
        },
        columns: [
          {
            name: EngineUserScalarFieldEnumInterface.id,
            title: marker('engine-user.grid.columns.id'),
          },
          {
            name: EngineUserScalarFieldEnumInterface.email,
            title: marker('engine-user.grid.columns.email'),
          },
          {
            name: EngineUserScalarFieldEnumInterface.firstname,
            title: marker('engine-user.grid.columns.firstname'),
          },
          {
            name: EngineUserScalarFieldEnumInterface.gender,
            title: marker('engine-user.grid.columns.gender'),
          },
          {
            name: EngineUserScalarFieldEnumInterface.phone,
            title: marker('engine-user.grid.columns.phone'),
          },
          {
            name: EngineUserScalarFieldEnumInterface.picture,
            title: marker('engine-user.grid.columns.picture'),
            isFile: true,
          },
          {
            name: EngineUserScalarFieldEnumInterface.roles,
            title: marker('engine-user.grid.columns.roles'),
          },
          {
            name: EngineUserScalarFieldEnumInterface.username,
            title: marker('engine-user.grid.columns.username'),
          },
        ],
      }),
    },
    relatedCrud: {
      handlers: () => ({
        findOne(id: string) {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineRefreshSessionsControllerFindOne(id)
            .pipe(map((s) => toSessionModel(s)));
        },

        findMany({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineRefreshSessionsControllerFindMany(
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
              map(({ meta, engineRefreshSessions }) => ({
                meta,
                items: engineRefreshSessions.map((t) => toSessionModel(t)),
              })),
            );
        },

        updateOne(id: string, data: EngineSessionModel) {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineRefreshSessionsControllerUpdateOne(id, toSessionJson(data))
            .pipe(map((s) => toSessionModel(s)));
        },
      }),
      form: () => ({
        inputs: [
          {
            key: EngineRefreshSessionScalarFieldEnumInterface.enabled,
            type: 'checkbox',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-session.form.fields.enabled`),
              placeholder: 'enabled',
              required: true,
            },
          },
          {
            key: EngineRefreshSessionScalarFieldEnumInterface.expiresAt,
            type: 'date-input',
            validation: {
              show: true,
            },
            props: {
              type: 'number',
              label: translocoService.translate(`engine-session.form.fields.expires-at`),
              placeholder: 'expiresAt',
              required: false,
            },
          },
          {
            key: EngineRefreshSessionScalarFieldEnumInterface.fingerprint,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-session.form.fields.fingerprint`),
              placeholder: 'fingerprint',
              required: false,
            },
          },
          {
            key: EngineRefreshSessionScalarFieldEnumInterface.userAgent,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-session.form.fields.user-agent`),
              placeholder: 'userAgent',
              required: false,
            },
          },
          {
            key: EngineRefreshSessionScalarFieldEnumInterface.userData,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-session.form.fields.user-data`),
              placeholder: 'userData',
              required: false,
            },
          },
          {
            key: EngineRefreshSessionScalarFieldEnumInterface.userIp,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-session.form.fields.user-ip`),
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
            title: marker('engine-session.update-modal.title'),
          },
        },
        columns: [
          {
            name: EngineRefreshSessionScalarFieldEnumInterface.id,
            title: marker('engine-session.grid.columns.id'),
          },
          {
            name: EngineRefreshSessionScalarFieldEnumInterface.userAgent,
            title: marker('engine-session.grid.columns.user-agent'),
          },
          {
            name: EngineRefreshSessionScalarFieldEnumInterface.fingerprint,
            title: marker('engine-session.grid.columns.fingerprint'),
          },
          {
            name: EngineRefreshSessionScalarFieldEnumInterface.userIp,
            title: marker('engine-session.grid.columns.user-ip'),
          },
          {
            name: EngineRefreshSessionScalarFieldEnumInterface.expiresAt,
            title: marker('engine-session.grid.columns.expires-at'),
          },
          {
            name: EngineRefreshSessionScalarFieldEnumInterface.userData,
            title: marker('engine-session.grid.columns.user-data'),
          },
          {
            name: EngineRefreshSessionScalarFieldEnumInterface.enabled,
            title: marker('engine-session.grid.columns.enabled'),
          },
        ],
      }),
    },
  };
}
