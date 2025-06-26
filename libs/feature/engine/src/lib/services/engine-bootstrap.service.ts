import { isInfrastructureMode } from '@nestjs-mod/common';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EngineProjectService } from './engine-project.service';
import { EngineUsersService } from './engine-users.service';

@Injectable()
export class EngineServiceBootstrap implements OnModuleInit {
  private readonly logger = new Logger(EngineServiceBootstrap.name);

  constructor(
    private readonly engineProjectService: EngineProjectService,
    private readonly engineUsersService: EngineUsersService,
  ) {}

  async onModuleInit() {
    this.logger.debug('onModuleInit');

    if (isInfrastructureMode()) {
      return;
    }

    await this.engineProjectService.getOrCreateDefaultProject();

    await this.engineProjectService.createDefaultPublicProjects();

    await this.engineUsersService.createAdmin();
  }
}
