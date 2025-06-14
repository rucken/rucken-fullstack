import { NgModule } from '@angular/core';
import {
  RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN,
  RuckenAfatEngineConfiguration,
} from './engine-afat.configuration';

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
      ],
      exports: [RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN],
    };
  }
}
