import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { getText } from 'nestjs-translates';

export enum EngineErrorEnum {
  COMMON = 'ENGINE-000',
  UserNotFound = 'ENGINE-001',
  WrongPassword = 'ENGINE-002',
  UserIsExists = 'ENGINE-003',
  ActivateEmailWrongCode = 'ENGINE-004',
  ActivateEmailNotProcessed = 'ENGINE-005',
  ActivateEmailProcessed = 'ENGINE-006',
  RefreshTokenNotProvided = 'ENGINE-007',
  SessionExpired = 'ENGINE-008',
  InvalidRefreshSession = 'ENGINE-009',
  AccessTokenExpired = 'ENGINE-010',
  EmailIsExists = 'ENGINE-011',
  EmailNotVerified = 'ENGINE-012',
  Forbidden = 'ENGINE-013',
  WrongOldPassword = 'ENGINE-014',
  NonExistentRoleSpecified = 'ENGINE-015',
  BadAccessToken = 'ENGINE-016',
  YourSessionHasBeenBlocked = 'ENGINE-017',
  VerificationCodeNotFound = 'ENGINE-018',
}

export const ENGINE_ERROR_ENUM_TITLES: Record<EngineErrorEnum, string> = {
  [EngineErrorEnum.COMMON]: getText('Engine error'),
  [EngineErrorEnum.UserNotFound]: getText('User not found'),
  [EngineErrorEnum.WrongPassword]: getText('Wrong password'),
  [EngineErrorEnum.UserIsExists]: getText('User is exists'),
  [EngineErrorEnum.ActivateEmailWrongCode]: getText('Wrong activate email code'),
  [EngineErrorEnum.ActivateEmailNotProcessed]: getText('Activate email not processed'),
  [EngineErrorEnum.ActivateEmailProcessed]: getText('Activate email processed'),
  [EngineErrorEnum.RefreshTokenNotProvided]: getText('Refresh token not provided'),
  [EngineErrorEnum.SessionExpired]: getText('Session expired'),
  [EngineErrorEnum.InvalidRefreshSession]: getText('Invalid refresh session'),
  [EngineErrorEnum.AccessTokenExpired]: getText('Access token expired'),
  [EngineErrorEnum.EmailIsExists]: getText('User is exists'),
  [EngineErrorEnum.EmailNotVerified]: getText('Email not verified'),
  [EngineErrorEnum.Forbidden]: getText('Forbidden'),
  [EngineErrorEnum.WrongOldPassword]: getText('Wrong old password'),
  [EngineErrorEnum.NonExistentRoleSpecified]: getText('Non-existent role specified'),
  [EngineErrorEnum.BadAccessToken]: getText('Bad access token'),
  [EngineErrorEnum.YourSessionHasBeenBlocked]: getText('Your session has been blocked'),
  [EngineErrorEnum.VerificationCodeNotFound]: getText('Verification code not found'),
};

export class EngineError<T = unknown> extends Error {
  @ApiProperty({
    type: String,
    description: Object.entries(ENGINE_ERROR_ENUM_TITLES)
      .map(([key, value]) => `${value} (${key})`)
      .join(', '),
    example: ENGINE_ERROR_ENUM_TITLES[EngineErrorEnum.COMMON],
  })
  override message: string;

  @ApiProperty({
    enum: EngineErrorEnum,
    enumName: 'EngineErrorEnum',
    example: EngineErrorEnum.COMMON,
  })
  code = EngineErrorEnum.COMMON;

  @ApiPropertyOptional({ type: Object })
  metadata?: T;

  constructor(message?: string | EngineErrorEnum, code?: EngineErrorEnum, metadata?: T) {
    const messageAsCode = Boolean(message && Object.values(EngineErrorEnum).includes(message as EngineErrorEnum));
    const preparedCode = messageAsCode ? (message as EngineErrorEnum) : code;
    const preparedMessage = messageAsCode && preparedCode ? ENGINE_ERROR_ENUM_TITLES[preparedCode] : message;

    code = preparedCode || EngineErrorEnum.COMMON;
    message = preparedMessage || ENGINE_ERROR_ENUM_TITLES[code];

    super(message);

    this.code = code;
    this.message = message;
    this.metadata = metadata;
  }
}
