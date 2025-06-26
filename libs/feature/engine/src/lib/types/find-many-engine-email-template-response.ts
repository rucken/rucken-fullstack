import { FindManyResponseMeta } from '@nestjs-mod/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { EngineEmailTemplateDto } from '../generated/rest/dto/engine-email-template.dto';

export class FindManyEngineEmailTemplateResponse {
  @ApiProperty({ type: () => [EngineEmailTemplateDto] })
  engineEmailTemplates!: EngineEmailTemplateDto[];

  @ApiProperty({ type: () => FindManyResponseMeta })
  meta!: FindManyResponseMeta;
}
