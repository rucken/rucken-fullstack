import { LangDefinition, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { RequestMeta, TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import { LayoutPart } from '../layout/layout.configuration';
import {
  CreateSsoProjectDtoInterface,
  RuckenRestSdkAngularService,
  SsoProjectDtoInterface,
  SsoProjectScalarFieldEnumInterface,
  SsoPublicProjectDtoInterface,
  SsoRoleInterface,
  UpdateSsoProjectDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { addHours } from 'date-fns';
import { map } from 'rxjs';

export interface SsoProjectModel
  extends Partial<Omit<SsoProjectDtoInterface, 'createdAt' | 'updatedAt' | 'nameLocale'>> {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export function projectsLayoutPart(
  ruckenRestSdkAngularService: RuckenRestSdkAngularService,
  translocoService: TranslocoService,
): LayoutPart {
  //

  const toModel = (item?: SsoPublicProjectDtoInterface | SsoProjectDtoInterface): SsoProjectModel => {
    return {
      ...item,
      createdAt: item?.createdAt ? addHours(new Date(item.createdAt), TIMEZONE_OFFSET) : null,
      updatedAt: item?.updatedAt ? addHours(new Date(item.updatedAt), TIMEZONE_OFFSET) : null,
      ...Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [`name_${a.id}`, item?.nameLocale?.[a.id] || ''];
        }),
      ),
    };
  };

  const toJson = (data: SsoProjectModel) => {
    return {
      public: data.public === true,
      name: data.name || '',
      clientId: data.clientId || '',
      clientSecret: data.clientSecret || '',
      nameLocale: Object.fromEntries(
        getAvailableLangs().map((a) => {
          return [a.id, data[`name_${a.id}`] || ''];
        }),
      ),
    };
  };

  //

  const getAvailableLangs = () => {
    return (translocoService.getAvailableLangs() as LangDefinition[]).filter(
      (availableLang) => availableLang.id !== translocoService.getDefaultLang(),
    );
  };

  return {
    roles: [SsoRoleInterface.admin],
    second: true,
    navigation: {
      link: '/projects',
      title: marker('Projects'),
    },
    crud: {
      handlers: () => ({
        findOne: (id: string) => {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoProjectsControllerFindOne(id)
            .pipe(map((p) => toModel(p)));
        },

        findMany: ({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) => {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoProjectsControllerFindMany(
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
              map(({ meta, ssoProjects }) => ({
                meta,
                items: ssoProjects.map((p) => toModel(p)),
              })),
            );
        },

        updateOne: (id: string, data: UpdateSsoProjectDtoInterface) => {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoProjectsControllerUpdateOne(id, toJson(data))
            .pipe(map((p) => toModel(p)));
        },

        deleteOne: (id: string) => {
          return ruckenRestSdkAngularService.getSsoApi().ssoProjectsControllerDeleteOne(id);
        },

        createOne: (data: CreateSsoProjectDtoInterface) => {
          return ruckenRestSdkAngularService
            .getSsoApi()
            .ssoProjectsControllerCreateOne(toJson(data))
            .pipe(map((p) => toModel(p)));
        },
      }),
      form: () => ({
        inputs: [
          ...(translocoService.getAvailableLangs() as LangDefinition[]).map((a) => ({
            key: a.id === translocoService.getDefaultLang() ? 'name' : `name_${a.id}`,
            type: 'textarea',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(
                `sso-project.form.fields.name-locale`,
                // id, label
                {
                  locale: a.id,
                  label: translocoService.translate(a.label),
                },
              ),
              placeholder: a.id === translocoService.getDefaultLang() ? 'name' : `name ${a.id}`,
              required: a.id === translocoService.getDefaultLang(),
            },
          })),
          {
            key: SsoProjectScalarFieldEnumInterface.clientId,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`sso-project.form.fields.client-id`),
              placeholder: 'clientId',
              required: true,
            },
          },
          {
            key: SsoProjectScalarFieldEnumInterface.clientSecret,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`sso-project.form.fields.client-secret`),
              placeholder: 'clientSecret',
              required: true,
            },
          },
          {
            key: SsoProjectScalarFieldEnumInterface.public,
            type: 'checkbox',
            validation: {
              show: true,
            },
            defaultValue: false,
            props: {
              label: translocoService.translate(`sso-project.form.fields.public`),
              placeholder: 'public',
              required: true,
            },
          },
        ],
      }),
      grid: () => ({
        actions: {
          create: {
            title: marker('sso-project.create-modal.title'),
          },
          delete: {
            title: marker('sso-project.delete-modal.title'),
          },
          update: {
            title: marker('sso-project.update-modal.title'),
          },
        },
        columns: [
          {
            name: SsoProjectScalarFieldEnumInterface.id,
            title: marker('sso-project.grid.columns.id'),
          },
          {
            name: SsoProjectScalarFieldEnumInterface.name,
            title: marker('sso-project.grid.columns.name'),
          },
          {
            name: SsoProjectScalarFieldEnumInterface.clientId,
            title: marker('sso-project.grid.columns.client-id'),
          },
          {
            name: SsoProjectScalarFieldEnumInterface.clientSecret,
            title: marker('sso-project.grid.columns.client-secret'),
          },
          {
            name: SsoProjectScalarFieldEnumInterface.public,
            title: marker('sso-project.grid.columns.public'),
          },
        ],
      }),
    },
  };
}
