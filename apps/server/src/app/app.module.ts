import {
  createNestModule,
  getRequestFromExecutionContext,
  NestModuleCategory,
} from '@nestjs-mod/common';

import { PrismaModule } from '@nestjs-mod/prisma';
import { ValidationError, ValidationErrorEnum } from '@nestjs-mod/validation';
import { APP_FILTER } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { RuckenSsoModule, RUCKEN_SSO_FEATURE, SsoRequest } from '@rucken/sso';
import { TranslatesModule } from 'nestjs-translates';
import { join } from 'path';
import { APP_FEATURE } from './app.constants';
import { AppExceptionsFilter } from './app.filter';
import { TimeController } from './controllers/time.controller';

export const { AppModule } = createNestModule({
  moduleName: 'AppModule',
  moduleCategory: NestModuleCategory.feature,
  imports: [
    PrismaModule.forFeature({
      contextName: RUCKEN_SSO_FEATURE,
      featureModuleName: RUCKEN_SSO_FEATURE,
    }),
    RuckenSsoModule.forFeature({
      featureModuleName: APP_FEATURE,
    }),
    PrismaModule.forFeature({
      contextName: RUCKEN_SSO_FEATURE,
      featureModuleName: APP_FEATURE,
    }),
    TranslatesModule.forRootDefault({
      localePaths: [
        join(__dirname, 'assets', 'i18n'),
        join(__dirname, 'assets', 'i18n', 'getText'),
        join(__dirname, 'assets', 'i18n', 'cv-messages'),
        join(__dirname, 'assets', 'i18n', 'nestjs-mod-prisma-tools'),
        join(__dirname, 'assets', 'i18n', 'nestjs-mod-validation'),
      ],
      vendorLocalePaths: [join(__dirname, 'assets', 'i18n')],
      locales: ['en', 'ru'],
      validationPipeOptions: {
        transform: true,
        whitelist: true,
        validationError: {
          target: false,
          value: false,
        },
        exceptionFactory: (errors) => {
          console.log(errors);
          return new ValidationError(
            ValidationErrorEnum.COMMON,
            undefined,
            errors
          );
        },
      },
      usePipes: true,
      useInterceptors: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 60,
          ttl: 24 * 60 * 60 * 1000,
          skipIf: (ctx) => {
            const req: SsoRequest = getRequestFromExecutionContext(ctx);
            return req.skipThrottle === true;
          },
        },
      ],
    }),
    ...(process.env.RUCKEN_DISABLE_SERVE_STATIC
      ? []
      : [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'client', 'browser'),
          }),
        ]),
  ],
  controllers: [TimeController],
  providers: [
    TimeController,
    { provide: APP_FILTER, useClass: AppExceptionsFilter },
  ],
});
