import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { getText } from 'nestjs-translates';

export enum EngineErrorEnum {
  COMMON = 'ENGINE-000',
}

export const ENGINE_ERROR_ENUM_TITLES: Record<EngineErrorEnum, string> = {
  [EngineErrorEnum.COMMON]: getText('Engine error'),
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
