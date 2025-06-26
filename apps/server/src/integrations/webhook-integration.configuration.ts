import { PrismaModule } from '@nestjs-mod/prisma';
import { WEBHOOK_FEATURE, WebhookModule } from '@nestjs-mod/webhook';
import { CheckEngineRole, RUCKEN_ENGINE_FEATURE, EngineGuard, RuckenEngineModule, EngineRole } from '@rucken/engine';
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
      guards: [EngineGuard],
      mutateController: (ctrl) => {
        CheckEngineRole([EngineRole.user, EngineRole.admin, EngineRole.manager])(ctrl);
        return ctrl;
      },
    },
    configuration: {
      syncMode: false,
    },
  };
}
