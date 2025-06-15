import { NgModule } from '@angular/core';
import { RuckenRestClientApiModule, RuckenRestClientConfiguration } from './generated';

@NgModule({})
export class RuckenRestSdkAngularModule {
  public static forRoot(configuration: Partial<RuckenRestClientConfiguration>) {
    const ruckenRestClientConfiguration = new RuckenRestClientConfiguration(configuration);
    const ruckenRestClientApiModule = RuckenRestClientApiModule.forRoot(() => ruckenRestClientConfiguration);
    return {
      ngModule: RuckenRestSdkAngularModule,
      providers: [
        {
          provide: RuckenRestClientConfiguration,
          useValue: ruckenRestClientConfiguration,
        },
      ],
      imports: [ruckenRestClientApiModule],
      exports: [ruckenRestClientApiModule, RuckenRestClientConfiguration],
    };
  }
}
