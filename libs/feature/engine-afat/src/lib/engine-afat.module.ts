import { NgModule } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import {
  RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN,
  RuckenAfatEngineConfiguration,
} from './engine-afat.configuration';
import { ROOT_PATH_MARKER, SECOND_PATH_MARKER } from './engine-afat.constants';
import { pagesRoutes } from './pages/pages.routes';

@NgModule({})
export class RuckenAfatEngineModule {
  public static forRoot(configuration: Partial<RuckenAfatEngineConfiguration>) {
    return {
      ngModule: RuckenAfatEngineModule,
      providers: [
        {
          provide: RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN,
          useValue: configuration,
        },
        provideRouter([
          {
            path: '',
            redirectTo:
              configuration.layoutConfiguration?.parts.find((p) => p.root)
                ?.navigation.link || '/home',
            pathMatch: 'full',
          },
          {
            path: ROOT_PATH_MARKER.slice(1),
            redirectTo:
              configuration.layoutConfiguration?.parts.find((p) => p.root)
                ?.navigation.link || '/home',
            pathMatch: 'full',
          },
          {
            path: SECOND_PATH_MARKER.slice(1),
            redirectTo:
              configuration.layoutConfiguration?.parts.find((p) => p.second)
                ?.navigation.link || '/home',
            pathMatch: 'full',
          },
          ...pagesRoutes,
          ...((configuration.layoutConfiguration?.parts
            .filter((p) => p.route)
            .map((p) => ({
              ...p.route,
              title: p.route?.title || p.navigation.title,
            }))
            .filter(Boolean) as Route[]) || []),
        ]),
      ],
      exports: [RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN],
    };
  }
}
