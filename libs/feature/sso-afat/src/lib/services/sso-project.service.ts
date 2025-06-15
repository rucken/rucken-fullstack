import { Injectable } from '@angular/core';
import { RequestMeta } from '@nestjs-mod/misc';
import {
  CreateSsoProjectDtoInterface,
  RuckenRestSdkAngularService,
  UpdateSsoProjectDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { map } from 'rxjs';
import { SsoProjectMapperService } from './sso-project-mapper.service';
@Injectable({ providedIn: 'root' })
export class SsoProjectService {
  constructor(
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    private readonly ssoProjectMapperService: SsoProjectMapperService
  ) {}

  findOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerFindOne(id)
      .pipe(map((p) => this.ssoProjectMapperService.toModel(p)));
  }

  findManyPublic({
    filters,
    meta,
  }: {
    filters: Record<string, string>;
    meta?: RequestMeta;
  }) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoPublicProjectsControllerFindMany(
        meta?.curPage,
        meta?.perPage,
        filters['search'],
        meta?.sort
          ? Object.entries(meta?.sort)
              .map(([key, value]) => `${key}:${value}`)
              .join(',')
          : undefined
      )
      .pipe(
        map(({ meta, ssoPublicProjects }) => ({
          meta,
          ssoPublicProjects: ssoPublicProjects.map((p) =>
            this.ssoProjectMapperService.toPublicModel(p)
          ),
        }))
      );
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
      .ssoProjectsControllerFindMany(
        meta?.curPage,
        meta?.perPage,
        filters['search'],
        meta?.sort
          ? Object.entries(meta?.sort)
              .map(([key, value]) => `${key}:${value}`)
              .join(',')
          : undefined
      )
      .pipe(
        map(({ meta, ssoProjects }) => ({
          meta,
          items: ssoProjects.map((p) =>
            this.ssoProjectMapperService.toModel(p)
          ),
        }))
      );
  }

  updateOne(id: string, data: UpdateSsoProjectDtoInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerUpdateOne(id, data)
      .pipe(map((p) => this.ssoProjectMapperService.toModel(p)));
  }

  deleteOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerDeleteOne(id);
  }

  createOne(data: CreateSsoProjectDtoInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerCreateOne(data)
      .pipe(map((p) => this.ssoProjectMapperService.toModel(p)));
  }
}
