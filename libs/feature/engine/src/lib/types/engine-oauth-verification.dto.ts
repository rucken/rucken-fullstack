import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class EngineOAuthVerificationArgs {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  verificationCode!: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  fingerprint!: string;
}
