import { LangDefinition, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { RequestMeta, TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import { LayoutPart } from '../layout/layout.configuration';
import {
  RuckenRestSdkAngularService,
  EngineEmailTemplateDtoInterface,
  EngineEmailTemplateScalarFieldEnumInterface,
  EngineRoleInterface,
  UpdateEngineEmailTemplateDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { addHours } from 'date-fns';
import { map } from 'rxjs';

export interface EngineEmailTemplateModel
  extends Partial<
    Omit<
      EngineEmailTemplateDtoInterface,
      'subjectLocale' | 'textLocale' | 'htmlLocale' | 'projectId' | 'createdAt' | 'updatedAt'
    >
  > {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export function emailTemplatesLayoutPart(
  ruckenRestSdkAngularService: RuckenRestSdkAngularService,
  translocoService: TranslocoService,
): LayoutPart {
  //

  const getAvailableLangs = () => {
    return translocoService.getAvailableLangs() as LangDefinition[];
  };

  //

  const toModel = (item?: EngineEmailTemplateDtoInterface): EngineEmailTemplateModel => {
    return {
      ...item,
      createdAt: item?.createdAt ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET) : null,
      updatedAt: item?.updatedAt ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET) : null,
      ...Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [`subject_${a.id}`, item?.subjectLocale?.[a.id] || ''];
        }),
      ),
      ...Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [`html_${a.id}`, item?.htmlLocale?.[a.id] || ''];
        }),
      ),
      ...Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [`text_${a.id}`, item?.textLocale?.[a.id] || ''];
        }),
      ),
    };
  };

  const toJson = (data: EngineEmailTemplateModel) => {
    return {
      operationName: data.operationName || '',
      subject: data.subject || '',
      html: data.html || '',
      text: data.text || '',
      subjectLocale: Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [a.id, data[`subject_${a.id}`] || ''];
        }),
      ),
      htmlLocale: Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [a.id, data[`html_${a.id}`] || ''];
        }),
      ),
      textLocale: Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [a.id, data[`text_${a.id}`] || ''];
        }),
      ),
    };
  };

  return {
    roles: [EngineRoleInterface.manager, EngineRoleInterface.admin],
    navigation: {
      link: '/templates',
      title: marker('Templates'),
    },
    crud: {
      handlers: () => ({
        findOne: (id: string) => {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineEmailTemplatesControllerFindOne(id)
            .pipe(map((t) => toModel(t)));
        },

        findMany: ({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) => {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineEmailTemplatesControllerFindMany(
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
              map(({ meta, engineEmailTemplates }) => ({
                meta,
                items: engineEmailTemplates.map((t) => toModel(t)),
              })),
            );
        },

        updateOne: (id: string, data: UpdateEngineEmailTemplateDtoInterface) => {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineEmailTemplatesControllerUpdateOne(id, toJson(data))
            .pipe(map((t) => toModel(t)));
        },
      }),
      form: () => ({
        inputs: [
          {
            key: EngineEmailTemplateScalarFieldEnumInterface.operationName,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              readonly: true,
              disabled: true,
              label: translocoService.translate(`engine-email-template.form.fields.operation-name`),
              placeholder: 'operationName',
            },
          },
          ...translocoService.getAvailableLangs().map((a) => ({
            key: a.id === translocoService.getDefaultLang() ? 'subject' : `subject_${a.id}`,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(
                `engine-email-template.form.fields.subject-locale`,
                // id, label
                {
                  locale: a.id,
                  label: translocoService.translate(a.label),
                },
              ),
              placeholder: a.id === translocoService.getDefaultLang() ? 'subject' : `subject ${a.id}`,
              required: a.id === translocoService.getDefaultLang(),
            },
          })),
          ...translocoService.getAvailableLangs().map((a) => ({
            key: a.id === translocoService.getDefaultLang() ? 'html' : `html_${a.id}`,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(
                `engine-email-template.form.fields.html-locale`,
                // id, label
                {
                  locale: a.id,
                  label: translocoService.translate(a.label),
                },
              ),
              placeholder: a.id === translocoService.getDefaultLang() ? 'html' : `html ${a.id}`,
              required: a.id === translocoService.getDefaultLang(),
            },
          })),
          ...translocoService.getAvailableLangs().map((a) => ({
            key: a.id === translocoService.getDefaultLang() ? 'text' : `text_${a.id}`,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(
                `engine-email-template.form.fields.text-locale`,
                // id, label
                {
                  locale: a.id,
                  label: translocoService.translate(a.label),
                },
              ),
              placeholder: a.id === translocoService.getDefaultLang() ? 'text' : `text ${a.id}`,
              required: a.id === translocoService.getDefaultLang(),
            },
          })),
        ],
      }),
      grid: () => ({
        title: marker('Email templates'),
        actions: {
          update: {
            title: marker('engine-email-template.update-modal.title'),
            width: '700px',
          },
        },
        columns: [
          {
            name: EngineEmailTemplateScalarFieldEnumInterface.id,
            title: marker('engine-email-template.grid.columns.id'),
          },
          {
            name: EngineEmailTemplateScalarFieldEnumInterface.operationName,
            title: marker('engine-email-template.grid.columns.operation-name'),
          },
          {
            name: EngineEmailTemplateScalarFieldEnumInterface.subject,
            title: marker('engine-email-template.grid.columns.subject'),
          },
          {
            name: EngineEmailTemplateScalarFieldEnumInterface.text,
            title: marker('engine-email-template.grid.columns.text'),
          },
        ],
      }),
    },
  };
}
