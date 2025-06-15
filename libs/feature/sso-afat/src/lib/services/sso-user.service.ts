import { Injectable } from '@angular/core';
import { RequestMeta } from '@nestjs-mod/misc';
import {
  SendInvitationLinksArgsInterface,
  RuckenRestSdkAngularService,
  UpdateSsoUserDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { map } from 'rxjs';
import { SsoUserMapperService } from './sso-user-mapper.service';

@Injectable({ providedIn: 'root' })
export class SsoUserService {
  constructor(
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    private readonly ssoUserMapperService: SsoUserMapperService
  ) {}

  findOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoUsersControllerFindOne(id)
      .pipe(map((u) => this.ssoUserMapperService.toModel(u)));
  }

  findMany({
    filters,
    meta,
  }: {
    filters: Record<string, string>;
    meta?: RequestMeta;
  }) {
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
        filters['projectId']
      )
      .pipe(
        map(({ meta, ssoUsers }) => ({
          meta,
          items: ssoUsers.map((p) => this.ssoUserMapperService.toModel(p)),
        }))
      );
  }

  updateOne(id: string, data: UpdateSsoUserDtoInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoUsersControllerUpdateOne(id, data)
      .pipe(map((p) => this.ssoUserMapperService.toModel(p)));
  }

  sendInvitationLinks(data: SendInvitationLinksArgsInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoUsersControllerSendInvitationLinks(data);
  }
}
