import { NgModule, Provider } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { CrudComponent } from './dynamic-pages/crud/crud.component';
import {
  RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN,
  RuckenAfatEngineConfiguration,
} from './engine-afat.configuration';
import { ROOT_PATH_MARKER, SECOND_PATH_MARKER } from './engine-afat.constants';
import { pagesRoutes } from './pages/pages.routes';
import { SsoRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import {
  SsoGuardService,
  SSO_GUARD_DATA_ROUTE_KEY,
  SsoGuardData,
  OnActivateOptions,
} from '@rucken/sso-afat';

export function provideRuckenAfatEngine(
  useFactory: (...deps: any[]) => RuckenAfatEngineConfiguration,
  deps?: any[]
) {
  const configuration = useFactory(...(deps || []));
  return [
    {
      provide: RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN,
      useValue: configuration,
    } as Provider,
    provideRouter([
      {
        path: '',
        redirectTo:
          configuration.layout?.parts.find((p) => p.root)?.navigation.link ||
          '/home',
        pathMatch: 'full',
      },
      {
        path: ROOT_PATH_MARKER.slice(1),
        redirectTo:
          configuration.layout?.parts.find((p) => p.root)?.navigation.link ||
          '/home',
        pathMatch: 'full',
      },
      {
        path: SECOND_PATH_MARKER.slice(1),
        redirectTo:
          configuration.layout?.parts.find((p) => p.second)?.navigation.link ||
          '/home',
        pathMatch: 'full',
      },
      ...pagesRoutes,
      ...((configuration.layout?.parts
        .filter((p) => p.route || p.crud)
        .map((p) => ({
          ...p.route,
          title: p.route?.title || p.navigation.title,
          ...(p.crud
            ? {
                component: CrudComponent,
                data: {
                  ...p.crud,
                  title: p.crud.title || p.route?.title || p.navigation.title,
                },
              }
            : {}),
          path: p.route?.path ? p.route?.path : p.navigation.link?.slice(1),
          ...(p.roles?.length
            ? {
                canActivate: p.route?.canActivate || [SsoGuardService],
                data: {
                  [SSO_GUARD_DATA_ROUTE_KEY]:
                    p.route?.data?.[SSO_GUARD_DATA_ROUTE_KEY] ||
                    new SsoGuardData({
                      roles: p.roles,
                      afterActivate: async (options: OnActivateOptions) => {
                        if (options.error) {
                          options.router.navigate([ROOT_PATH_MARKER]);
                          return false;
                        }
                        return true;
                      },
                    }),
                },
              }
            : {}),
        }))
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
