import { ApiProperty } from '@nestjs/swagger';

export class FindManyEngineRoleResponse {
  @ApiProperty({ type: () => [String] })
  userAvailableRoles!: string[];

  @ApiProperty({ type: () => [String] })
  userDefaultRoles!: string[];

  @ApiProperty({ type: () => [String] })
  adminDefaultRoles!: string[];
}
