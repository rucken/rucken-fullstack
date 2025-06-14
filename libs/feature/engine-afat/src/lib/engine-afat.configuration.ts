import { InjectionToken } from '@angular/core';

export class RuckenAfatEngineConfiguration {
  optionsName!: string;
}

export const RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN =
  new InjectionToken<RuckenAfatEngineConfiguration>(
    'RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN'
  );
