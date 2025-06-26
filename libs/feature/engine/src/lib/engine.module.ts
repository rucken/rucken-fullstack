import { createNestModule, getFeatureDotEnvPropertyNameFormatter, NestModuleCategory } from '@nestjs-mod/common';
import { KeyvModule } from '@nestjs-mod/keyv';
import { PrismaModule } from '@nestjs-mod/prisma';
import { PrismaToolsModule } from '@nestjs-mod/prisma-tools';
import { WebhookModule } from '@nestjs-mod/webhook';
import { UseGuards } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaPg } from '@prisma/adapter-pg';
import { TranslatesModule } from 'nestjs-translates';
import { EngineEmailTemplatesController } from './controllers/engine-email-templates.controller';
import { EngineOAuthController } from './controllers/engine-oauth.controller';
import { EngineProjectsController } from './controllers/engine-projects.controller';
import { EnginePublicProjectsController } from './controllers/engine-public-projects.controller';
import { EngineRolesController } from './controllers/engine-roles.controller';
import { EngineRefreshSessionsController } from './controllers/engine-sessions.controller';
import { EngineUsersController } from './controllers/engine-users.controller';
import { EngineController } from './controllers/engine.controller';
import { EngineTimezoneInterceptor } from './interceptors/engine-timezone.interceptor';
import { EngineTimezonePipe } from './pipes/auth-timezone.pipe';
import { EngineServiceBootstrap } from './services/engine-bootstrap.service';
import { EngineCacheService } from './services/engine-cache.service';
import { EngineCookieService } from './services/engine-cookie.service';
import { EngineEventsService } from './services/engine-events.service';
import { EnginePasswordService } from './services/engine-password.service';
import { EngineProjectService } from './services/engine-project.service';
import { EngineTemplatesService } from './services/engine-templates.service';
import { EngineTimezoneService } from './services/engine-timezone.service';
import { EngineTokensService } from './services/engine-tokens.service';
import { EngineUsersService } from './services/engine-users.service';
import { EngineService } from './services/engine.service';
import { EngineConfiguration, EngineStaticConfiguration } from './engine.configuration';
import { RUCKEN_ENGINE_FEATURE, RUCKEN_ENGINE_MODULE } from './engine.constants';
import { EngineStaticEnvironments } from './engine.environments';
import { EngineExceptionsFilter } from './engine.filter';
import { EngineGuard } from './engine.guard';
import { EnginePrismaSdk } from './engine.prisma-sdk';
import { EngineGoogleOAuthController } from './strategies/google/engine-google-oauth.controller';
import { EngineGoogleOAuthStrategy } from './strategies/google/engine-google-oauth.strategy';
import { EngineAsyncLocalStorageContext } from './types/engine-async-local-storage-data';
import { ENGINE_WEBHOOK_EVENTS } from './types/engine-webhooks';

export const { RuckenEngineModule } = createNestModule({
  moduleName: RUCKEN_ENGINE_MODULE,
  moduleCategory: NestModuleCategory.feature,
  staticEnvironmentsModel: EngineStaticEnvironments,
  staticConfigurationModel: EngineStaticConfiguration,
  configurationModel: EngineConfiguration,
  imports: [
    KeyvModule.forFeature({ featureModuleName: RUCKEN_ENGINE_FEATURE }),
    PrismaModule.forFeature({
      contextName: RUCKEN_ENGINE_FEATURE,
      featureModuleName: RUCKEN_ENGINE_FEATURE,
    }),
    PrismaToolsModule.forFeature({
      featureModuleName: RUCKEN_ENGINE_FEATURE,
    }),
    WebhookModule.forFeature({
      featureModuleName: RUCKEN_ENGINE_FEATURE,
      featureConfiguration: {
        events: ENGINE_WEBHOOK_EVENTS,
      },
    }),
    TranslatesModule,
    PrismaModule.forRoot({
      contextName: RUCKEN_ENGINE_FEATURE,
      staticConfiguration: {
        featureName: RUCKEN_ENGINE_FEATURE,
        provider: 'prisma-client',
        prismaClientFactory: async (options) => {
          const { url, ...otherOoptions } = options;
          const adapter = new PrismaPg({ connectionString: url });
          return new EnginePrismaSdk.PrismaClient({ adapter, ...otherOoptions });
        },
        moduleFormat: 'cjs',
      },
    }),
  ],
  sharedImports: [
    KeyvModule.forFeature({ featureModuleName: RUCKEN_ENGINE_FEATURE }),
    PrismaModule.forFeature({
      contextName: RUCKEN_ENGINE_FEATURE,
      featureModuleName: RUCKEN_ENGINE_FEATURE,
    }),
    PrismaToolsModule.forFeature({
      featureModuleName: RUCKEN_ENGINE_FEATURE,
    }),
    TranslatesModule,
  ],
  controllers: (asyncModuleOptions) =>
    [
      EngineController,
      EngineUsersController,
      EngineProjectsController,
      EngineRefreshSessionsController,
      EngineRolesController,
      EnginePublicProjectsController,
      EngineEmailTemplatesController,
      EngineOAuthController,
      EngineGoogleOAuthController,
    ].map((ctrl) => {
      if (asyncModuleOptions.staticEnvironments?.useGuards) {
        UseGuards(EngineGuard)(ctrl);
      }
      return ctrl;
    }),
  providers: (asyncModuleOptions) => [
    EngineServiceBootstrap,
    EngineGoogleOAuthStrategy,
    ...(asyncModuleOptions.staticEnvironments.useFilters
      ? [{ provide: APP_FILTER, useClass: EngineExceptionsFilter }]
      : []),
    ...(asyncModuleOptions.staticEnvironments.useInterceptors
      ? [{ provide: APP_INTERCEPTOR, useClass: EngineTimezoneInterceptor }]
      : []),
    ...(asyncModuleOptions.staticEnvironments.usePipes ? [{ provide: APP_PIPE, useClass: EngineTimezonePipe }] : []),
  ],
  sharedProviders: [
    EngineService,
    EngineUsersService,
    EngineCookieService,
    EngineEventsService,
    EnginePasswordService,
    EngineCacheService,
    EngineTokensService,
    EngineProjectService,
    EngineTemplatesService,
    JwtService,
    EngineAsyncLocalStorageContext,
    EngineTimezoneService,
  ],
  wrapForRootAsync: (asyncModuleOptions) => {
    if (!asyncModuleOptions) {
      asyncModuleOptions = {};
    }
    const FomatterClass = getFeatureDotEnvPropertyNameFormatter(RUCKEN_ENGINE_FEATURE);
    Object.assign(asyncModuleOptions, {
      environmentsOptions: {
        propertyNameFormatters: [new FomatterClass()],
        name: RUCKEN_ENGINE_FEATURE,
      },
    });

    return { asyncModuleOptions };
  },
});
