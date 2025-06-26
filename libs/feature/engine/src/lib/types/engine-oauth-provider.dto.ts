import { ApiProperty } from '@nestjs/swagger';
import { EngineOAuthProviderDto } from '../generated/rest/dto/engine-o-auth-provider.dto';

export class OAuthProvider extends EngineOAuthProviderDto {
  @ApiProperty({
    type: 'string',
  })
  url!: string;
}

export class FindManyEngineOAuthProviderResponse {
  @ApiProperty({ type: () => [OAuthProvider] })
  engineOAuthProvider!: OAuthProvider[];
}
