import { FindManyResponseMeta } from '@nestjs-mod/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { EngineUser } from '../generated/rest/dto/engine-user.entity';

export class FindManyAuthUserResponse {
  @ApiProperty({ type: () => [EngineUser] })
  authUsers!: EngineUser[];

  @ApiProperty({ type: () => FindManyResponseMeta })
  meta!: FindManyResponseMeta;
}
