import { PrismaModule } from '@nestjs-mod/prisma';
import { WEBHOOK_FEATURE, WebhookModule } from '@nestjs-mod/webhook';
import { CheckSsoRole, RUCKEN_ENGINE_FEATURE, SsoGuard, RuckenEngineModule, SsoRole } from '@rucken/engine';
import { TranslatesModule } from 'nestjs-translates';

export function webhookModuleForRootAsyncOptions(): Parameters<typeof WebhookModule.forRootAsync>[0] {
  return {
    imports: [
      RuckenEngineModule.forFeature({
        featureModuleName: WEBHOOK_FEATURE,
      }),
      PrismaModule.forFeature({
        featureModuleName: WEBHOOK_FEATURE,
        contextName: RUCKEN_ENGINE_FEATURE,
      }),
      TranslatesModule,
    ],
    staticConfiguration: {
      guards: [SsoGuard],
      mutateController: (ctrl) => {
        CheckSsoRole([SsoRole.user, SsoRole.admin, SsoRole.manager])(ctrl);
        return ctrl;
      },
    },
    configuration: {
      syncMode: false,
    },
  };
}
