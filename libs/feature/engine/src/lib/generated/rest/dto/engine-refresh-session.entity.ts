import { Prisma } from '../../prisma-client';
import { ApiProperty } from '@nestjs/swagger';
import { EngineProject } from './engine-project.entity';
import { EngineUser } from './engine-user.entity';

export class EngineRefreshSession {
  @ApiProperty({
    type: 'string',
  })
  id!: string;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  userAgent!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  userIp!: string | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  expiresAt!: Date | null;
  @ApiProperty({
    type: () => Object,
    nullable: true,
  })
  userData!: Prisma.JsonValue | null;
  @ApiProperty({
    type: 'boolean',
  })
  enabled!: boolean;
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
  EngineProject?: EngineProject;
  @ApiProperty({
    type: () => EngineUser,
    required: false,
  })
  EngineUser?: EngineUser;
}
