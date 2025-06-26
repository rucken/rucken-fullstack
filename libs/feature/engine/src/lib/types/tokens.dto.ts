import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { EngineUser } from '../generated/rest/dto/engine-user.entity';
import { EngineUserDto } from '../generated/rest/dto/engine-user.dto';

export class TokensResponse {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  accessToken!: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  refreshToken!: string;

  @ApiProperty({ type: () => EngineUser })
  user!: EngineUserDto;
}
