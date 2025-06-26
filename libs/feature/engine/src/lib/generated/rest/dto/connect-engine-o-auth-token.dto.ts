import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EngineOAuthTokenProviderIdProjectIdUserIdAccessTokenUniqueInputDto {
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
  projectId!: string;
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  userId!: string;
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  accessToken!: string;
}

@ApiExtraModels(EngineOAuthTokenProviderIdProjectIdUserIdAccessTokenUniqueInputDto)
export class ConnectEngineOAuthTokenDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
  @ApiProperty({
    type: EngineOAuthTokenProviderIdProjectIdUserIdAccessTokenUniqueInputDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EngineOAuthTokenProviderIdProjectIdUserIdAccessTokenUniqueInputDto)
  providerId_projectId_userId_accessToken?: EngineOAuthTokenProviderIdProjectIdUserIdAccessTokenUniqueInputDto;
}
