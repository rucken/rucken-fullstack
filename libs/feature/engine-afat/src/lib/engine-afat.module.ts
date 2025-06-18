import { NgModule, Provider } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { OnActivateOptions, SSO_GUARD_DATA_ROUTE_KEY, SsoGuardData, SsoGuardService } from '@rucken/sso-afat';
import { CrudComponent } from './dynamic-pages/crud-page/crud-page.component';
import { CrudConfiguration } from './dynamic-pages/crud-page/crud-page.configuration';
import { RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN, RuckenAfatEngineConfiguration } from './engine-afat.configuration';
import {
  ENGINE_AFAT_GUARD_CRUD_DATA_ROUTE_KEY,
  ENGINE_AFAT_GUARD_RELATED_CRUD_DATA_ROUTE_KEY,
  ROOT_PATH_MARKER,
  SECOND_PATH_MARKER,
} from './engine-afat.constants';
import { pagesRoutes } from './pages/pages.routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function provideRuckenAfatEngine(useFactory: (...deps: any[]) => RuckenAfatEngineConfiguration, deps?: any[]) {
  let configuration = useFactory(...(deps || []));
  return [
    {
      provide: RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN,
      useFactory: (...deps) => {
        const result = useFactory(...deps);
        configuration = result;
        return result;
      },
      deps,
    } as Provider,
    provideRouter([
      {
        path: '',
        redirectTo: configuration.layout?.parts.find((p) => p.root)?.navigation?.['link'] || '/home',
        pathMatch: 'full',
      },
      {
        path: ROOT_PATH_MARKER.slice(1),
        redirectTo: configuration.layout?.parts.find((p) => p.root)?.navigation?.['link'] || '/home',
        pathMatch: 'full',
      },
      {
        path: SECOND_PATH_MARKER.slice(1),
        redirectTo: configuration.layout?.parts.find((p) => p.second)?.navigation?.['link'] || '/home',
        pathMatch: 'full',
      },
      ...pagesRoutes,
      ...((configuration.layout?.parts
        .map((part, index) => ({ part, index }))
        .filter(({ part }) => part.route || part.crud)
        .map(({ part, index }) => {
          return {
            ...part.route,
            title: part.route?.title || part.navigation.title,
            ...(part.crud
              ? {
                  component: part.crud.component || CrudComponent,
                }
              : {}),
            path: part.route?.path ? part.route?.path : part.navigation?.['link']?.slice(1),
            ...(part.roles?.length
              ? {
                  canActivate: part.route?.canActivate || [SsoGuardService],
                }
              : {}),
            data: {
              ...(part.route?.data || {}),
              ...(part.crud
                ? {
                    [ENGINE_AFAT_GUARD_CRUD_DATA_ROUTE_KEY]: {
                      title: part.crud.title || part.route?.title || part.navigation.title,
                      handlers: () => configuration.layout.parts[index].crud?.handlers(),
                      form: () => configuration.layout.parts[index].crud?.form(),
                      grid: () => configuration.layout.parts[index].crud?.grid(),
                    } as CrudConfiguration,
                  }
                : {}),
              ...(part.relatedCrud
                ? {
                    [ENGINE_AFAT_GUARD_RELATED_CRUD_DATA_ROUTE_KEY]: {
                      title: part.relatedCrud.title,
                      handlers: () => configuration.layout.parts[index].relatedCrud?.handlers(),
                      form: () => configuration.layout.parts[index].relatedCrud?.form(),
                      grid: () => configuration.layout.parts[index].relatedCrud?.grid(),
                    } as CrudConfiguration,
                  }
                : {}),
              ...(part.roles?.length
                ? {
                    [SSO_GUARD_DATA_ROUTE_KEY]:
                      part.route?.data?.[SSO_GUARD_DATA_ROUTE_KEY] ||
                      new SsoGuardData({
                        roles: part.roles,
                        afterActivate: async (options: OnActivateOptions) => {
                          if (options.error) {
                            options.router.navigate([ROOT_PATH_MARKER]);
                            return false;
                          }
                          return true;
                        },
                      }),
                  }
                : {}),
            },
          };
        })
        .filter(Boolean) as Route[]) || []),
    ]),
  ];
}
@NgModule({})
export class RuckenAfatEngineModule {
  public static forRoot(configuration: RuckenAfatEngineConfiguration) {
    return {
      ngModule: RuckenAfatEngineModule,
      providers: provideRuckenAfatEngine(() => configuration),
      exports: [RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN],
    };
  }
}
