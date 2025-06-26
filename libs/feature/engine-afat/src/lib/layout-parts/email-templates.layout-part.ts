import { LangDefinition, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { RequestMeta, TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import { LayoutPart } from '../layout/layout.configuration';
import {
  RuckenRestSdkAngularService,
  SsoEmailTemplateDtoInterface,
  SsoEmailTemplateScalarFieldEnumInterface,
  SsoRoleInterface,
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

export function emailTemplatesLayoutPart(
  ruckenRestSdkAngularService: RuckenRestSdkAngularService,
  translocoService: TranslocoService,
): LayoutPart {
  //

  const getAvailableLangs = () => {
    return translocoService.getAvailableLangs() as LangDefinition[];
  };

  //

  const toModel = (item?: SsoEmailTemplateDtoInterface): SsoEmailTemplateModel => {
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

  const toJson = (data: SsoEmailTemplateModel) => {
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
    roles: [SsoRoleInterface.manager, SsoRoleInterface.admin],
    navigation: {
      link: '/templates',
      title: marker('Templates'),
    },
    crud: {
      handlers: () => ({
        findOne: (id: string) => {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoEmailTemplatesControllerFindOne(id)
            .pipe(map((t) => toModel(t)));
        },

        findMany: ({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) => {
          return ruckenRestSdkAngularService
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
                items: ssoEmailTemplates.map((t) => toModel(t)),
              })),
            );
        },

        updateOne: (id: string, data: UpdateSsoEmailTemplateDtoInterface) => {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoEmailTemplatesControllerUpdateOne(id, toJson(data))
            .pipe(map((t) => toModel(t)));
        },
      }),
      form: () => ({
        inputs: [
          {
            key: SsoEmailTemplateScalarFieldEnumInterface.operationName,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              readonly: true,
              disabled: true,
              label: translocoService.translate(`sso-email-template.form.fields.operation-name`),
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
                `sso-email-template.form.fields.subject-locale`,
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
                `sso-email-template.form.fields.html-locale`,
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
                `sso-email-template.form.fields.text-locale`,
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
            title: marker('sso-email-template.update-modal.title'),
            width: '700px',
          },
        },
        columns: [
          {
            name: SsoEmailTemplateScalarFieldEnumInterface.id,
            title: marker('sso-email-template.grid.columns.id'),
          },
          {
            name: SsoEmailTemplateScalarFieldEnumInterface.operationName,
            title: marker('sso-email-template.grid.columns.operation-name'),
          },
          {
            name: SsoEmailTemplateScalarFieldEnumInterface.subject,
            title: marker('sso-email-template.grid.columns.subject'),
          },
          {
            name: SsoEmailTemplateScalarFieldEnumInterface.text,
            title: marker('sso-email-template.grid.columns.text'),
          },
        ],
      }),
    },
  };
}
