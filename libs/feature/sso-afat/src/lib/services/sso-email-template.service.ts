import { Injectable } from '@angular/core';
import { RequestMeta } from '@nestjs-mod/misc';
import {
  RuckenRestSdkAngularService,
  UpdateSsoEmailTemplateDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { map } from 'rxjs';
import { SsoEmailTemplateMapperService } from './sso-email-template-mapper.service';

@Injectable({ providedIn: 'root' })
export class SsoEmailTemplateService {
  constructor(
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    private readonly ssoEmailTemplateMapperService: SsoEmailTemplateMapperService
  ) {}

  findOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoEmailTemplatesControllerFindOne(id)
      .pipe(map((t) => this.ssoEmailTemplateMapperService.toModel(t)));
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
      .ssoEmailTemplatesControllerFindMany(
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
        map(({ meta, ssoEmailTemplates }) => ({
          meta,
          items: ssoEmailTemplates.map((t) =>
            this.ssoEmailTemplateMapperService.toModel(t)
          ),
        }))
      );
  }

  updateOne(id: string, data: UpdateSsoEmailTemplateDtoInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoEmailTemplatesControllerUpdateOne(id, data)
      .pipe(map((t) => this.ssoEmailTemplateMapperService.toModel(t)));
  }
}
