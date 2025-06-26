import { ApiProperty } from '@nestjs/swagger';
import { EngineOAuthProviderSettings } from './engine-o-auth-provider-settings.entity';
import { EngineOAuthToken } from './engine-o-auth-token.entity';

export class EngineOAuthProvider {
  @ApiProperty({
    type: 'string',
  })
  id!: string;
  @ApiProperty({
    type: 'string',
  })
  name!: string;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  createdAt!: Date;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  updatedAt!: Date;
  @ApiProperty({
    type: () => EngineOAuthProviderSettings,
    isArray: true,
    required: false,
  })
  EngineOAuthProviderSettings?: EngineOAuthProviderSettings[];
  @ApiProperty({
    type: () => EngineOAuthToken,
    isArray: true,
    required: false,
  })
  EngineOAuthToken?: EngineOAuthToken[];
}
