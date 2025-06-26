import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EngineOAuthProviderSettingsProviderIdNameUniqueInputDto {
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  providerId!: string;
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

@ApiExtraModels(EngineOAuthProviderSettingsProviderIdNameUniqueInputDto)
export class ConnectEngineOAuthProviderSettingsDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
  @ApiProperty({
    type: EngineOAuthProviderSettingsProviderIdNameUniqueInputDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EngineOAuthProviderSettingsProviderIdNameUniqueInputDto)
  providerId_name?: EngineOAuthProviderSettingsProviderIdNameUniqueInputDto;
}
