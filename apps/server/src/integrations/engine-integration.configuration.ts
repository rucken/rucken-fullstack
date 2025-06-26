import { getRequestFromExecutionContext } from '@nestjs-mod/common';
import { FilesRequest, FilesRole } from '@nestjs-mod/files';
import { searchIn } from '@nestjs-mod/misc';
import { NotificationsModule, NotificationsService, SendNotificationOptionsType } from '@nestjs-mod/notifications';
import { PrismaModule } from '@nestjs-mod/prisma';
import { TwoFactorModule, TwoFactorService } from '@nestjs-mod/two-factor';
import { WebhookModule, WebhookPrismaSdk, WebhookRequest, WebhookUsersService } from '@nestjs-mod/webhook';
import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  RuckenEngineModule,
  RUCKEN_ENGINE_FEATURE,
  RUCKEN_ENGINE_MODULE,
  EngineConfiguration,
  EngineRequest,
  EngineRole,
  EngineSendNotificationOptions,
  EngineTwoFactorCodeGenerateOptions,
  EngineTwoFactorCodeValidateOptions,
  EngineUser,
} from '@rucken/engine';
import { APP_FEATURE } from '../app/app.constants';

@Injectable()
export class EngineIntegrationConfiguration implements EngineConfiguration {
  constructor(
    private readonly webhookUsersService: WebhookUsersService,
    private readonly twoFactorService: TwoFactorService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async checkAccessValidator(authUser?: EngineUser | null, ctx?: ExecutionContext) {
    const req: EngineRequest & WebhookRequest & FilesRequest = ctx ? getRequestFromExecutionContext(ctx) : {};

    if (
      typeof ctx?.getClass === 'function' &&
      typeof ctx?.getHandler === 'function' &&
      ctx?.getClass().name === 'TerminusHealthCheckController' &&
      ctx?.getHandler().name === 'check'
    ) {
      req.skipEmptyEngineUser = true;
    }

    req.externalTenantId = req.engineProject?.id;

    if (req?.engineUser?.id) {
      req.externalUserId = req.engineUser?.id;

      // webhook
      const webhookUserRole = searchIn(req.engineUser?.roles, EngineRole.admin)
        ? WebhookPrismaSdk.WebhookRole.Admin
        : searchIn(req.engineUser?.roles, EngineRole.manager)
          ? WebhookPrismaSdk.WebhookRole.User
          : undefined;
      if (webhookUserRole) {
        // todo: create in engine module options for local events and use event with name sign-up for run this logic
        req.webhookUser = await this.webhookUsersService.createUserIfNotExists({
          externalUserId: req?.engineUser?.id,
          externalTenantId: req?.engineProject?.id,
          userRole: webhookUserRole,
        });
        req.webhookUser.userRole = webhookUserRole;
      }

      // files
      req.filesUser = {
        userRole: searchIn(req.engineUser?.roles, EngineRole.admin) ? FilesRole.Admin : FilesRole.User,
      };
    }
  }

  async sendNotification(options: EngineSendNotificationOptions) {
    return await this.notificationsService.sendNotification({
      externalTenantId: options.projectId,
      html: options.html,
      operationName: options.operationName,
      recipients: options.recipientUsers.map((recipientUser) => ({
        externalUserId: recipientUser.id,
        email: recipientUser.email || undefined,
        phone: recipientUser.phone || undefined,
        name:
          recipientUser.firstname && recipientUser.lastname
            ? `${recipientUser.firstname} ${recipientUser.lastname}`
            : undefined,
      })),
      subject: options.subject,
      type: options.recipientUsers[0].phoneVerifiedAt
        ? SendNotificationOptionsType.phone
        : SendNotificationOptionsType.email,
      sender: options.senderUser
        ? {
            externalUserId: options.senderUser.id,
            email: options.senderUser.email || undefined,
            phone: options.senderUser.phone || undefined,
            name:
              options.senderUser.firstname && options.senderUser.lastname
                ? `${options.senderUser.firstname} ${options.senderUser.lastname}`
                : undefined,
          }
        : undefined,
      text: options.text,
    });
  }

  async twoFactorCodeGenerate(options: EngineTwoFactorCodeGenerateOptions) {
    const generatedCode = await this.twoFactorService.generateCode({
      externalTenantId: options.user.projectId,
      externalUserId: options.user.id,
      externalUsername: options.user.username || undefined,
      operationName: options.operationName,
      type: options.user.phoneVerifiedAt ? 'phone' : 'email',
    });
    return generatedCode.code;
  }

  async twoFactorCodeValidate(options: EngineTwoFactorCodeValidateOptions) {
    const validatedCode = await this.twoFactorService.validateCode({
      externalTenantId: options.projectId,
      operationName: options.operationName,
      code: options.code,
    });
    return {
      userId: validatedCode.twoFactorUser.externalUserId,
    };
  }
}

export function engineModuleForRootAsyncOptions(): Parameters<typeof RuckenEngineModule.forRootAsync>[0] {
  return {
    imports: [
      RuckenEngineModule.forFeature({
        featureModuleName: RUCKEN_ENGINE_MODULE,
      }),
      PrismaModule.forFeature({
        contextName: RUCKEN_ENGINE_FEATURE,
        featureModuleName: RUCKEN_ENGINE_MODULE,
      }),
      WebhookModule.forFeature({
        featureModuleName: RUCKEN_ENGINE_MODULE,
      }),

      TwoFactorModule.forFeature({ featureModuleName: APP_FEATURE }),
      NotificationsModule.forFeature({ featureModuleName: APP_FEATURE }),
    ],
    inject: [TwoFactorService, NotificationsService],
    configurationClass: EngineIntegrationConfiguration,
  };
}
