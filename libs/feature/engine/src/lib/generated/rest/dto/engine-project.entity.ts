import { Prisma } from '../../prisma-client';
import { ApiProperty } from '@nestjs/swagger';
import { EngineEmailTemplate } from './engine-email-template.entity';
import { EngineOAuthToken } from './engine-o-auth-token.entity';
import { EngineRefreshSession } from './engine-refresh-session.entity';
import { EngineUser } from './engine-user.entity';

export class EngineProject {
  @ApiProperty({
    type: 'string',
  })
  id!: string;
  @ApiProperty({
    type: 'string',
  })
  name!: string;
  @ApiProperty({
    type: () => Object,
    nullable: true,
  })
  nameLocale!: Prisma.JsonValue | null;
  @ApiProperty({
    type: 'string',
  })
  clientId!: string;
  @ApiProperty({
    type: 'string',
  })
  clientSecret!: string;
  @ApiProperty({
    type: 'boolean',
  })
  public!: boolean;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  createdAt!: Date;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  updatedAt!: Date;
  @ApiProperty({
    type: () => EngineEmailTemplate,
    isArray: true,
    required: false,
  })
  EngineEmailTemplate?: EngineEmailTemplate[];
  @ApiProperty({
    type: () => EngineOAuthToken,
    isArray: true,
    required: false,
  })
  EngineOAuthToken_EngineOAuthToken_projectIdToEngineOAuthProvider?: EngineOAuthToken[];
  @ApiProperty({
    type: () => EngineRefreshSession,
    isArray: true,
    required: false,
  })
  EngineRefreshSession?: EngineRefreshSession[];
  @ApiProperty({
    type: () => EngineUser,
    isArray: true,
    required: false,
  })
  EngineUser?: EngineUser[];
}
