import { ConfigModel, ConfigModelProperty } from '@nestjs-mod/common';
import { ExecutionContext, Type } from '@nestjs/common';
import { EngineUser } from './generated/rest/dto/engine-user.entity';

export enum OperationName {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  COMPLETE_FORGOT_PASSWORD = 'COMPLETE_FORGOT_PASSWORD',
  COMPLETE_REGISTRATION_USING_THE_INVITATION_LINK = 'COMPLETE_REGISTRATION_USING_THE_INVITATION_LINK',
}

export type EngineSendNotificationOptions = {
  senderUser?: EngineUser;
  recipientUsers: EngineUser[];
  subject: string;
  html: string;
  text?: string;
  projectId: string;
  operationName: OperationName;
};

export type EngineTwoFactorCodeValidateOptions = {
  code: string;
  projectId: string;
  operationName: OperationName;
};

export type EngineTwoFactorCodeGenerateOptions = {
  user: EngineUser;
  operationName: OperationName;
};

export type EngineTwoFactorCodeValidateResponse = {
  userId: string;
};

export type EngineSendNotificationResponse = {
  recipientGroupId: string;
};

@ConfigModel()
export class EngineConfiguration {
  // header names
  @ConfigModelProperty({
    description: 'The name of the header key that stores the register client ID',
    default: 'x-client-id',
  })
  clientIdHeaderName?: string;

  @ConfigModelProperty({
    description: 'The name of the header key that stores the register client secret',
    default: 'x-client-secret',
  })
  clientSecretHeaderName?: string;

  @ConfigModelProperty({
    description: 'The name of the header key that stores the admin secret key',
    default: 'x-admin-secret',
  })
  adminSecretHeaderName?: string;

  // two factor
  @ConfigModelProperty({
    description: 'Function for generating two-factor authentication code',
    default: (options: EngineTwoFactorCodeGenerateOptions) => Buffer.from(options.user.id).toString('hex'),
  })
  twoFactorCodeGenerate?: (options: EngineTwoFactorCodeGenerateOptions) => Promise<string>;

  @ConfigModelProperty({
    description: 'Two-factor authentication code verification function',
    default: (options: EngineTwoFactorCodeValidateOptions) => Buffer.from(options.code, 'hex').toString(),
  })
  twoFactorCodeValidate?: (options: EngineTwoFactorCodeValidateOptions) => Promise<EngineTwoFactorCodeValidateResponse>;

  // notification
  @ConfigModelProperty({
    description: 'Function for sending notifications',
  })
  sendNotification?: (options: EngineSendNotificationOptions) => Promise<EngineSendNotificationResponse | null>;

  // external validator
  @ConfigModelProperty({
    description: 'External function for validate permissions',
  })
  checkAccessValidator?: (authUser?: EngineUser | null, ctx?: ExecutionContext) => Promise<void>;
}

@ConfigModel()
export class EngineStaticConfiguration {
  @ConfigModelProperty({
    description: 'Function for additional mutation of controllers',
  })
  mutateController?: (ctrl: Type) => Type;
}
