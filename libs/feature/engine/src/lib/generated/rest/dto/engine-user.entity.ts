import { Prisma } from '../../prisma-client';
import { ApiProperty } from '@nestjs/swagger';
import { EngineOAuthToken } from './engine-o-auth-token.entity';
import { EngineRefreshSession } from './engine-refresh-session.entity';
import { EngineProject } from './engine-project.entity';

export class EngineUser {
  @ApiProperty({
    type: 'string',
  })
  id!: string;
  @ApiProperty({
    type: 'string',
  })
  email!: string;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  phone!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  username!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  roles!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  firstname!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  lastname!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  gender!: string | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  birthdate!: Date | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  picture!: string | null;
  @ApiProperty({
    type: () => Object,
    nullable: true,
  })
  appData!: Prisma.JsonValue | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  revokedAt!: Date | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  emailVerifiedAt!: Date | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  phoneVerifiedAt!: Date | null;
  @ApiProperty({
    type: 'number',
    format: 'float',
    nullable: true,
  })
  timezone!: number | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  lang!: string | null;
  @ApiProperty({
    type: 'string',
  })
  projectId!: string;
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
    type: () => EngineOAuthToken,
    isArray: true,
    required: false,
  })
  EngineOAuthToken?: EngineOAuthToken[];
  @ApiProperty({
    type: () => EngineRefreshSession,
    isArray: true,
    required: false,
  })
  EngineRefreshSession?: EngineRefreshSession[];
  @ApiProperty({
    type: () => EngineProject,
    required: false,
  })
  EngineProject?: EngineProject;
}
