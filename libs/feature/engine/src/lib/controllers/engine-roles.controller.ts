import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { EngineStaticEnvironments } from '../engine.environments';
import { FindManyEngineRoleResponse } from '../types/find-many-engine-role-response';

@ApiTags('Engine')
@Controller('/engine/roles')
export class EngineRolesController {
  constructor(private readonly engineStaticEnvironments: EngineStaticEnvironments) {}

  @Get()
  @ApiOkResponse({ type: FindManyEngineRoleResponse })
  async findMany() {
    return {
      adminDefaultRoles: this.engineStaticEnvironments.adminDefaultRoles,
      userAvailableRoles: this.engineStaticEnvironments.userAvailableRoles,
      userDefaultRoles: this.engineStaticEnvironments.userDefaultRoles,
    } as FindManyEngineRoleResponse;
  }
}
