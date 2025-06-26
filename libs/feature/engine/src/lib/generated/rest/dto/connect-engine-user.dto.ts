import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EngineUserEmailProjectIdUniqueInputDto {
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  email!: string;
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  projectId!: string;
}
export class EngineUserUsernameProjectIdUniqueInputDto {
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;
  @ApiProperty({
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  projectId!: string;
}

@ApiExtraModels(EngineUserEmailProjectIdUniqueInputDto, EngineUserUsernameProjectIdUniqueInputDto)
export class ConnectEngineUserDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
  @ApiProperty({
    type: EngineUserEmailProjectIdUniqueInputDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EngineUserEmailProjectIdUniqueInputDto)
  email_projectId?: EngineUserEmailProjectIdUniqueInputDto;
  @ApiProperty({
    type: EngineUserUsernameProjectIdUniqueInputDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EngineUserUsernameProjectIdUniqueInputDto)
  username_projectId?: EngineUserUsernameProjectIdUniqueInputDto;
}
