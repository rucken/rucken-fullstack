import { InjectionToken } from '@angular/core';
import { LayoutConfiguration } from './layout/layout.configuration';

export class RuckenAfatEngineConfiguration {
  layout!: LayoutConfiguration;
}

export const RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN =
  new InjectionToken<RuckenAfatEngineConfiguration>(
    'RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN'
  );
