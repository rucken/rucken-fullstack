import { FindManyResponseMeta } from '@nestjs-mod/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { EngineUserDto } from '../generated/rest/dto/engine-user.dto';

export class FindManyEngineUserResponse {
  @ApiProperty({ type: () => [EngineUserDto] })
  engineUsers!: EngineUserDto[];

  @ApiProperty({ type: () => FindManyResponseMeta })
  meta!: FindManyResponseMeta;
}
