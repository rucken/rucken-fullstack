import { Prisma } from '../../prisma-client';
import { ApiProperty } from '@nestjs/swagger';
import { EngineProject } from './engine-project.entity';
import { EngineOAuthProvider } from './engine-o-auth-provider.entity';
import { EngineUser } from './engine-user.entity';

export class EngineOAuthToken {
  @ApiProperty({
    type: 'string',
  })
  id!: string;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  grantedAt!: Date;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  expiresAt!: Date | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  tokenType!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  scope!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  verificationCode!: string | null;
  @ApiProperty({
    type: 'string',
  })
  userId!: string;
  @ApiProperty({
    type: 'string',
  })
  projectId!: string;
  @ApiProperty({
    type: 'string',
  })
  providerId!: string;
  @ApiProperty({
    type: 'string',
  })
  providerUserId!: string;
  @ApiProperty({
    type: () => Object,
    nullable: true,
  })
  providerUserData!: Prisma.JsonValue | null;
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
    type: () => EngineProject,
    required: false,
  })
  EngineOAuthProvider_EngineOAuthToken_projectIdToEngineOAuthProvider?: EngineProject;
  @ApiProperty({
    type: () => EngineOAuthProvider,
    required: false,
  })
  EngineOAuthProvider?: EngineOAuthProvider;
  @ApiProperty({
    type: () => EngineUser,
    required: false,
  })
  EngineUser?: EngineUser;
}
