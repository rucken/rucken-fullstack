import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EngineEmailTemplateProjectIdOperationNameUniqueInputDto {
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  projectId!: string;
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  operationName!: string;
}

@ApiExtraModels(EngineEmailTemplateProjectIdOperationNameUniqueInputDto)
export class ConnectEngineEmailTemplateDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
  @ApiProperty({
    type: EngineEmailTemplateProjectIdOperationNameUniqueInputDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EngineEmailTemplateProjectIdOperationNameUniqueInputDto)
  projectId_operationName?: EngineEmailTemplateProjectIdOperationNameUniqueInputDto;
}
