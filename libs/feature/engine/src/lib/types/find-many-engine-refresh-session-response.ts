import { FindManyResponseMeta } from '@nestjs-mod/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { EngineRefreshSessionDto } from '../generated/rest/dto/engine-refresh-session.dto';

export class FindManyEngineRefreshSessionResponse {
  @ApiProperty({ type: () => [EngineRefreshSessionDto] })
  engineRefreshSessions!: EngineRefreshSessionDto[];

  @ApiProperty({ type: () => FindManyResponseMeta })
  meta!: FindManyResponseMeta;
}
