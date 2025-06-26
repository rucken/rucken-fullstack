import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from './generated/prisma-client';
import { EngineError } from './engine.errors';
import { EngineRole } from './types/engine-role';

export const EngineEntities = class {
  role!: EngineRole;
};

Object.keys(Prisma)
  .filter((key) => key.endsWith('ScalarFieldEnum') && !key.startsWith('Migrations'))
  .map((enumName: string) => {
    const keyOfEntity = enumName.split('ScalarFieldEnum')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EngineEntities as any)['prototype'][keyOfEntity] = '';
    ApiProperty({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enum: (Prisma as any)[enumName],
      enumName: enumName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })((EngineEntities as any)['prototype'], keyOfEntity);
  });

ApiProperty({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enum: EngineRole,
  enumName: 'EngineRole',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
})((EngineEntities as any)['prototype'], 'role');

export const ENGINE_EXTRA_MODELS = [EngineError, EngineEntities];
