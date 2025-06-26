import { LangDefinition, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { RequestMeta, TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import { LayoutPart } from '../layout/layout.configuration';
import {
  CreateEngineProjectDtoInterface,
  RuckenRestSdkAngularService,
  EngineProjectDtoInterface,
  EngineProjectScalarFieldEnumInterface,
  EnginePublicProjectDtoInterface,
  EngineRoleInterface,
  UpdateEngineProjectDtoInterface,
} from '@rucken/rucken-rest-sdk-angular';
import { addHours } from 'date-fns';
import { map } from 'rxjs';

export interface EngineProjectModel
  extends Partial<Omit<EngineProjectDtoInterface, 'createdAt' | 'updatedAt' | 'nameLocale'>> {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export function projectsLayoutPart(
  ruckenRestSdkAngularService: RuckenRestSdkAngularService,
  translocoService: TranslocoService,
): LayoutPart {
  //

  const toModel = (item?: EnginePublicProjectDtoInterface | EngineProjectDtoInterface): EngineProjectModel => {
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

  const toJson = (data: EngineProjectModel) => {
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
    roles: [EngineRoleInterface.admin],
    second: true,
    navigation: {
      link: '/projects',
      title: marker('Projects'),
    },
    crud: {
      handlers: () => ({
        findOne: (id: string) => {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineProjectsControllerFindOne(id)
            .pipe(map((p) => toModel(p)));
        },

        findMany: ({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) => {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineProjectsControllerFindMany(
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
              map(({ meta, engineProjects }) => ({
                meta,
                items: engineProjects.map((p) => toModel(p)),
              })),
            );
        },

        updateOne: (id: string, data: UpdateEngineProjectDtoInterface) => {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineProjectsControllerUpdateOne(id, toJson(data))
            .pipe(map((p) => toModel(p)));
        },

        deleteOne: (id: string) => {
          return ruckenRestSdkAngularService.getEngineApi().engineProjectsControllerDeleteOne(id);
        },

        createOne: (data: CreateEngineProjectDtoInterface) => {
          return ruckenRestSdkAngularService
            .getEngineApi()
            .engineProjectsControllerCreateOne(toJson(data))
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
                `engine-project.form.fields.name-locale`,
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
            key: EngineProjectScalarFieldEnumInterface.clientId,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-project.form.fields.client-id`),
              placeholder: 'clientId',
              required: true,
            },
          },
          {
            key: EngineProjectScalarFieldEnumInterface.clientSecret,
            type: 'input',
            validation: {
              show: true,
            },
            props: {
              label: translocoService.translate(`engine-project.form.fields.client-secret`),
              placeholder: 'clientSecret',
              required: true,
            },
          },
          {
            key: EngineProjectScalarFieldEnumInterface.public,
            type: 'checkbox',
            validation: {
              show: true,
            },
            defaultValue: false,
            props: {
              label: translocoService.translate(`engine-project.form.fields.public`),
              placeholder: 'public',
              required: true,
            },
          },
        ],
      }),
      grid: () => ({
        actions: {
          create: {
            title: marker('engine-project.create-modal.title'),
          },
          delete: {
            title: marker('engine-project.delete-modal.title'),
          },
          update: {
            title: marker('engine-project.update-modal.title'),
          },
        },
        columns: [
          {
            name: EngineProjectScalarFieldEnumInterface.id,
            title: marker('engine-project.grid.columns.id'),
          },
          {
            name: EngineProjectScalarFieldEnumInterface.name,
            title: marker('engine-project.grid.columns.name'),
          },
          {
            name: EngineProjectScalarFieldEnumInterface.clientId,
            title: marker('engine-project.grid.columns.client-id'),
          },
          {
            name: EngineProjectScalarFieldEnumInterface.clientSecret,
            title: marker('engine-project.grid.columns.client-secret'),
          },
          {
            name: EngineProjectScalarFieldEnumInterface.public,
            title: marker('engine-project.grid.columns.public'),
          },
        ],
      }),
    },
  };
}
