import { Injectable } from '@angular/core';
import { LangDefinition, TranslocoService } from '@jsverse/transloco';
import { RequestMeta, TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import {
  RuckenRestSdkAngularService,
  SsoEmailTemplateDtoInterface,
  UpdateSsoEmailTemplateDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { addHours } from 'date-fns';
import { map } from 'rxjs';

export interface SsoEmailTemplateModel
  extends Partial<
    Omit<
      SsoEmailTemplateDtoInterface,
      'subjectLocale' | 'textLocale' | 'htmlLocale' | 'projectId' | 'createdAt' | 'updatedAt'
    >
  > {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

@Injectable({ providedIn: 'root' })
export class SsoEmailTemplateService {
  constructor(
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    protected readonly translocoService: TranslocoService,
  ) {}

  findOne(id: string) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoEmailTemplatesControllerFindOne(id)
      .pipe(map((t) => this.toModel(t)));
  }

  findMany({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
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
          : undefined,
      )
      .pipe(
        map(({ meta, ssoEmailTemplates }) => ({
          meta,
          items: ssoEmailTemplates.map((t) => this.toModel(t)),
        })),
      );
  }

  updateOne(id: string, data: UpdateSsoEmailTemplateDtoInterface) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoEmailTemplatesControllerUpdateOne(id, this.toJson(data))
      .pipe(map((t) => this.toModel(t)));
  }

  //

  toModel(item?: SsoEmailTemplateDtoInterface): SsoEmailTemplateModel {
    return {
      ...item,
      createdAt: item?.createdAt ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET) : null,
      updatedAt: item?.updatedAt ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET) : null,
      ...Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [`subject_${a.id}`, item?.subjectLocale?.[a.id] || ''];
        }),
      ),
      ...Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [`html_${a.id}`, item?.htmlLocale?.[a.id] || ''];
        }),
      ),
      ...Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [`text_${a.id}`, item?.textLocale?.[a.id] || ''];
        }),
      ),
    };
  }

  toJson(data: SsoEmailTemplateModel) {
    return {
      operationName: data.operationName || '',
      subject: data.subject || '',
      html: data.html || '',
      text: data.text || '',
      subjectLocale: Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [a.id, data[`subject_${a.id}`] || ''];
        }),
      ),
      htmlLocale: Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [a.id, data[`html_${a.id}`] || ''];
        }),
      ),
      textLocale: Object.fromEntries(
        this.getAvailableLangs().map((a) => {
          return [a.id, data[`text_${a.id}`] || ''];
        }),
      ),
    };
  }

  //

  private getAvailableLangs() {
    return this.translocoService.getAvailableLangs() as LangDefinition[];
  }
}
