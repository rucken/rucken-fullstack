import { FindManyResponseMeta } from '@nestjs-mod/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { EnginePublicProjectDto } from './engine-public-project.dto';

export class FindManyEnginePublicProjectResponse {
  @ApiProperty({ type: () => [EnginePublicProjectDto] })
  enginePublicProjects!: EnginePublicProjectDto[];

  @ApiProperty({ type: () => FindManyResponseMeta })
  meta!: FindManyResponseMeta;
}
