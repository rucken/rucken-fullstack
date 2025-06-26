import { FindManyResponseMeta } from '@nestjs-mod/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { EngineProjectDto } from '../generated/rest/dto/engine-project.dto';

export class FindManyEngineProjectResponse {
  @ApiProperty({ type: () => [EngineProjectDto] })
  engineProjects!: EngineProjectDto[];

  @ApiProperty({ type: () => FindManyResponseMeta })
  meta!: FindManyResponseMeta;
}
