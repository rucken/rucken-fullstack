import { Injectable } from '@angular/core';
import { RequestMeta } from '@nestjs-mod/misc';
import { RuckenRestSdkAngularService, SendInvitationLinksArgsInterface } from '@rucken/rucken-rest-sdk-angular';
import { map, mergeMap, of } from 'rxjs';

import { TIMEZONE_OFFSET, safeParseJson } from '@nestjs-mod/misc';
import { SsoUserDtoInterface } from '@rucken/rucken-rest-sdk-angular';

import { FilesService } from '@nestjs-mod/files-afat';
import { addHours, format } from 'date-fns';

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

@Injectable({ providedIn: 'root' })
export class SsoUserService {
  constructor(
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    private readonly filesService: FilesService,
  ) {}

  findOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoUsersControllerFindOne(id)
      .pipe(map((u) => this.toForm(this.toModel(u))));
  }

  findMany({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
    return this.ruckenRestSdkAngularService
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
          items: ssoUsers.map((p) => this.toModel(p)),
        })),
      );
  }

  updateOne(id: string, data: SsoUserModel) {
    const oldData = data;
    return (data.picture ? this.filesService.getPresignedUrlAndUploadFile(data.picture) : of('')).pipe(
      mergeMap((picture) =>
        this.ruckenRestSdkAngularService.getSsoApi().ssoUsersControllerUpdateOne(id, this.toJson({ ...data, picture })),
      ),
      mergeMap((newData) => {
        if (oldData.picture && typeof oldData.picture === 'string' && newData.picture !== oldData.picture) {
          return this.filesService.deleteFile(oldData.picture).pipe(map(() => newData));
        }
        return of(newData);
      }),
      map((p) => this.toModel(p)),
    );
  }

  sendInvitationLinks(data: SendInvitationLinksArgsInterface) {
    return this.ruckenRestSdkAngularService.getSsoApi().ssoUsersControllerSendInvitationLinks(data);
  }

  //

  toModel(item?: SsoUserDtoInterface): SsoUserModel {
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
  }

  toForm(model: SsoUserModel) {
    return {
      ...model,
      revokedAt: model.revokedAt ? format(model.revokedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      emailVerifiedAt: model.emailVerifiedAt ? format(model.emailVerifiedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      phoneVerifiedAt: model.phoneVerifiedAt ? format(model.phoneVerifiedAt, 'yyyy-MM-dd HH:mm:ss') : null,
      birthdate: model.birthdate ? format(model.birthdate, 'yyyy-MM-dd HH:mm:ss') : null,
    };
  }

  toJson(data: SsoUserModel) {
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
  }
}
