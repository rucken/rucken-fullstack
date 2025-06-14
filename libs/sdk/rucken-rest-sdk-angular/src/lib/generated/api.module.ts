import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { RuckenRestClientConfiguration } from './configuration';
import { HttpClient } from '@angular/common/http';


@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: []
})
export class RuckenRestClientApiModule {
    public static forRoot(configurationFactory: () => RuckenRestClientConfiguration): ModuleWithProviders<RuckenRestClientApiModule> {
        return {
            ngModule: RuckenRestClientApiModule,
            providers: [ { provide: RuckenRestClientConfiguration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: RuckenRestClientApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('RuckenRestClientApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
