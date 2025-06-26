process.env.TZ = 'UTC';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
import KeyvRedis from '@keyv/redis';
import {
  bootstrapNestApplication,
  DefaultNestApplicationInitializer,
  DefaultNestApplicationListener,
  isInfrastructureMode,
  PACKAGE_JSON_FILE,
  PROJECT_JSON_FILE,
  ProjectUtils,
} from '@nestjs-mod/common';
import { FILES_EXTRA_MODELS, FilesModule } from '@nestjs-mod/files';
import { KeyvModule } from '@nestjs-mod/keyv';
import { MinioModule } from '@nestjs-mod/minio';
import { NOTIFICATIONS_EXTRA_MODELS, NotificationsModule } from '@nestjs-mod/notifications';
import { NestjsPinoLoggerModule } from '@nestjs-mod/pino';
import { PrismaToolsModule } from '@nestjs-mod/prisma-tools';
import { TerminusHealthCheckModule } from '@nestjs-mod/terminus';
import { TwoFactorModule } from '@nestjs-mod/two-factor';
import { VALIDATION_EXTRA_MODELS, ValidationModule } from '@nestjs-mod/validation';
import { WEBHOOK_EXTRA_MODELS, WebhookModule } from '@nestjs-mod/webhook';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ENGINE_EXTRA_MODELS, RuckenEngineModule } from '@rucken/engine';
import cookieParser from 'cookie-parser';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from 'redis';
import { AppModule } from './app/app.module';
import { createAndFillDatabases, fillAllNeedDatabaseEnvsFromOneMain } from './create-and-fill-databases';
import { appFolder, rootFolder } from './environments/environment';
import { filesModuleForRootAsyncOptions } from './integrations/minio-files-integration.configuration';
import { notificationsModuleForRootAsyncOptions } from './integrations/notifications-integration.configuration';
import { engineModuleForRootAsyncOptions } from './integrations/engine-integration.configuration';
import { terminusHealthCheckModuleForRootAsyncOptions } from './integrations/terminus-health-check-integration.configuration';
import { webhookModuleForRootAsyncOptions } from './integrations/webhook-integration.configuration';
import { replaceEnvs } from './replace-envs';

fillAllNeedDatabaseEnvsFromOneMain();

bootstrapNestApplication({
  project: {
    name: 'rucken',
    description: 'Cross-platform full stack simple NestJS app with Angular',
  },
  modules: {
    system: [
      ProjectUtils.forRoot({
        staticConfiguration: {
          applicationPackageJsonFile: join(appFolder, PACKAGE_JSON_FILE),
          packageJsonFile: join(rootFolder, PACKAGE_JSON_FILE),
          nxProjectJsonFile: join(appFolder, PROJECT_JSON_FILE),
          envFile: join(rootFolder, '.env'),
          printAllApplicationEnvs: true,
        },
      }),
      DefaultNestApplicationInitializer.forRoot({
        staticConfiguration: { bufferLogs: true },
      }),
      DefaultNestApplicationListener.forRoot({
        staticConfiguration: {
          // When running in infrastructure mode, the backend server does not start.
          mode: isInfrastructureMode() ? 'silent' : 'listen',
          async preListen(options) {
            if (options.app) {
              options.app.use(cookieParser());

              const swaggerConf = new DocumentBuilder().addBearerAuth().build();
              const document = SwaggerModule.createDocument(options.app, swaggerConf, {
                extraModels: [
                  ...FILES_EXTRA_MODELS,
                  ...NOTIFICATIONS_EXTRA_MODELS,
                  ...ENGINE_EXTRA_MODELS,
                  ...VALIDATION_EXTRA_MODELS,
                  ...WEBHOOK_EXTRA_MODELS,
                ],
              });
              SwaggerModule.setup('swagger', options.app, document);

              options.app.useWebSocketAdapter(new WsAdapter(options.app));

              if (isInfrastructureMode()) {
                writeFileSync(join(rootFolder, 'app-swagger.json'), JSON.stringify(document));
              } else {
                await replaceEnvs();
                await createAndFillDatabases();
              }
            }
          },
        },
      }),
    ],
    feature: [
      NestjsPinoLoggerModule.forRoot(),
      TerminusHealthCheckModule.forRootAsync(terminusHealthCheckModuleForRootAsyncOptions()),
      PrismaToolsModule.forRoot(),
      // redis cache
      KeyvModule.forRoot({
        staticConfiguration: {
          storeFactoryByEnvironmentUrl: (uri) => {
            return isInfrastructureMode() ? undefined : [new KeyvRedis(createClient({ url: uri }))];
          },
        },
      }),
      // minio
      MinioModule.forRoot({
        staticConfiguration: { region: 'eu-central-1' },
        staticEnvironments: {
          minioUseSSL: 'false',
        },
      }),
      ValidationModule.forRoot({ staticEnvironments: { usePipes: false } }),
      FilesModule.forRootAsync(filesModuleForRootAsyncOptions()),
      TwoFactorModule.forRoot(),
      NotificationsModule.forRootAsync(notificationsModuleForRootAsyncOptions()),
      WebhookModule.forRootAsync(webhookModuleForRootAsyncOptions()),
      RuckenEngineModule.forRootAsync(engineModuleForRootAsyncOptions()),
      AppModule.forRoot(),
    ],
  },
});
