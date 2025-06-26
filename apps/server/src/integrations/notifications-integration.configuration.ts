import { NOTIFICATIONS_FEATURE, NotificationsModule, NotificationsRequest } from '@nestjs-mod/notifications';
import { CheckEngineRole, EngineGuard, RuckenEngineModule, EngineRequest, EngineRole } from '@rucken/engine';
import { getRequestFromExecutionContext } from '@nestjs-mod/common';
import { searchIn } from '@nestjs-mod/misc';
import { ExecutionContext } from '@nestjs/common';
import { TranslatesModule } from 'nestjs-translates';

export function notificationsModuleForRootAsyncOptions(): Parameters<typeof NotificationsModule.forRootAsync>[0] {
  return {
    imports: [
      RuckenEngineModule.forFeature({
        featureModuleName: NOTIFICATIONS_FEATURE,
      }),
      TranslatesModule,
    ],
    staticConfiguration: {
      guards: [EngineGuard],
      mutateController: (ctrl) => {
        CheckEngineRole([EngineRole.admin])(ctrl);
        return ctrl;
      },
    },
    configuration: {
      checkAccessValidator: async (ctx: ExecutionContext) => {
        const req = getRequestFromExecutionContext(ctx) as EngineRequest & NotificationsRequest;
        req.notificationIsAdmin = searchIn(EngineRole.admin, req.engineUser?.roles);
        req.externalTenantId = req.engineProject?.id;
      },
    },
  };
}
