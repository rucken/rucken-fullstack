import { Injectable } from '@angular/core';
import { LangDefinition, TranslocoService } from '@jsverse/transloco';
import { RequestMeta, TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import {
  CreateSsoProjectDtoInterface,
  RuckenRestSdkAngularService,
  SsoProjectDtoInterface,
  SsoPublicProjectDtoInterface,
  UpdateSsoProjectDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { addHours } from 'date-fns';
import { map } from 'rxjs';

export interface SsoProjectModel
  extends Partial<
    Omit<SsoProjectDtoInterface, 'createdAt' | 'updatedAt' | 'nameLocale'>
  > {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

@Injectable({ providedIn: 'root' })
export class SsoProjectService {
  constructor(
    private readonly translocoService: TranslocoService,
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService
  ) {}

  findOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerFindOne(id)
      .pipe(map((p) => this.toModel(p)));
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
          items: ssoPublicProjects.map((p) => this.toModel(p)),
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
          items: ssoProjects.map((p) => this.toModel(p)),
        }))
      );
  }

  updateOne(id: string, data: UpdateSsoProjectDtoInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerUpdateOne(id, this.toJson(data))
      .pipe(map((p) => this.toModel(p)));
  }

  deleteOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerDeleteOne(id);
  }

  createOne(data: CreateSsoProjectDtoInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoProjectsControllerCreateOne(this.toJson(data))
      .pipe(map((p) => this.toModel(p)));
  }

  //

  toModel(
    item?: SsoPublicProjectDtoInterface | SsoProjectDtoInterface
  ): SsoProjectModel {
    return {
      ...item,
      createdAt: item?.createdAt
        ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET)
        : null,
      updatedAt: item?.updatedAt
        ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET)
        : null,
      ...Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [`name_${a.id}`, item?.nameLocale?.[a.id] || ''];
        })
      ),
    };
  }

  toJson(data: SsoProjectModel) {
    return {
      public: data.public === true,
      name: data.name || '',
      clientId: data.clientId || '',
      clientSecret: data.clientSecret || '',
      nameLocale: Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [a.id, data[`name_${a.id}`] || ''];
        })
      ),
    };
  }

  //

  private getAvailableLangs() {
    return (
      this.translocoService.getAvailableLangs() as LangDefinition[]
    ).filter(
      (availableLang) =>
        availableLang.id !== this.translocoService.getDefaultLang()
    );
  }
}
