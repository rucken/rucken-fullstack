import { Injectable } from '@angular/core';
import { RequestMeta, TIMEZONE_OFFSET, safeParseJson } from '@nestjs-mod/misc';
import {
  RuckenRestSdkAngularService,
  SsoRefreshSessionDtoInterface,
  UpdateSsoRefreshSessionDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { addHours, format } from 'date-fns';
import { map } from 'rxjs';

export interface SsoSessionModel
  extends Partial<Omit<SsoRefreshSessionDtoInterface, 'createdAt' | 'updatedAt' | 'userData' | 'expiresAt'>> {
  userData?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  expiresAt?: Date | null;
}
@Injectable({ providedIn: 'root' })
export class SsoSessionService {
  constructor(private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService) {}

  findOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoRefreshSessionsControllerFindOne(id)
      .pipe(map((s) => this.toModel(s)));
  }

  findMany({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
    return this.ruckenRestSdkAngularService
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
          items: ssoRefreshSessions.map((t) => this.toModel(t)),
        })),
      );
  }

  updateOne(id: string, data: SsoSessionModel) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoRefreshSessionsControllerUpdateOne(id, this.toJson(data))
      .pipe(map((s) => this.toModel(s)));
  }

  //

  toModel(item?: SsoRefreshSessionDtoInterface): SsoSessionModel {
    return {
      ...item,
      userData: item?.userData ? JSON.stringify(item.userData) : '',
      expiresAt: item?.expiresAt ? addHours(new Date(item.expiresAt), TIMEZONE_OFFSET) : null,
      createdAt: item?.createdAt ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET) : null,
      updatedAt: item?.updatedAt ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET) : null,
    };
  }

  toJson(data: SsoSessionModel) {
    return {
      userData: data.userData ? safeParseJson(data.userData) : null,
      userAgent: data.userAgent || '',
      userIp: data.userIp || '',
      expiresAt: data.expiresAt ? format(new Date(data.expiresAt), 'yyyy-MM-dd HH:mm:ss') : undefined,
      enabled: data.enabled === true,
    };
  }
}
