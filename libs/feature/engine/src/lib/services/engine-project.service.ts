import { Injectable, Logger } from '@nestjs/common';
import { EngineConfiguration } from '../engine.configuration';
import { EngineStaticEnvironments } from '../engine.environments';
import { EngineError } from '../engine.errors';
import { EngineRequest } from '../types/engine-request';
import { EngineCacheService } from './engine-cache.service';

import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaClient } from '../generated/prisma-client';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { EngineTemplatesService } from './engine-templates.service';
@Injectable()
export class EngineProjectService {
  private readonly logger = new Logger(EngineProjectService.name);

  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly engineConfiguration: EngineConfiguration,
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
    private readonly engineCacheService: EngineCacheService,
    private readonly engineTemplatesService: EngineTemplatesService,
  ) {}

  async createDefaultPublicProjects() {
    for (const defaultPublicProject of this.engineStaticEnvironments.defaultPublicProjects || []) {
      try {
        const existsProject = await this.prismaClient.engineProject.findFirst({
          where: {
            name: defaultPublicProject.name,
          },
        });
        if (existsProject) {
          await this.engineTemplatesService.createProjectDefaultEmailTemplates(existsProject.id);
        }
        if (!existsProject) {
          const result = await this.prismaClient.engineProject.create({
            data: {
              public: true,
              name: defaultPublicProject.name,
              nameLocale: defaultPublicProject.nameLocale,
              clientId: defaultPublicProject.clientId,
              clientSecret: defaultPublicProject.clientSecret,
            },
          });

          await this.engineTemplatesService.createProjectDefaultEmailTemplates(result.id);

          await this.engineCacheService.clearCacheProjectByClientId(defaultPublicProject.clientId);
          await this.engineCacheService.getCachedProject(defaultPublicProject.clientId);
        }
      } catch (err) {
        this.logger.error(err, (err as Error).stack);
      }
    }
    this.logger.log('Default public projects created!');
  }

  async getProjectByRequest(req: EngineRequest) {
    req.engineClientId = this.getClientIdFromRequest(req);
    req.engineClientSecret = this.getClientSecretFromRequest(req);

    if (!req.engineClientId && this.engineStaticEnvironments.defaultProject?.clientId) {
      req.engineClientId = this.engineStaticEnvironments.defaultProject?.clientId;
    }

    if (!req.engineClientSecret && this.engineStaticEnvironments.defaultProject?.clientSecret) {
      req.engineClientSecret = this.engineStaticEnvironments.defaultProject?.clientSecret;
    }

    if (req.engineClientId) {
      const project = await this.engineCacheService.getCachedProject(req.engineClientId);
      if (project) {
        req.engineProject = project;
      } else {
        if (this.engineStaticEnvironments.defaultProject?.clientId) {
          req.engineClientId = this.engineStaticEnvironments.defaultProject?.clientId;
          const project = await this.engineCacheService.getCachedProject(req.engineClientId);
          if (project) {
            req.engineProject = project;
          }
        }
      }
    }
    if (req.engineProject) {
      return req.engineProject;
    }
    throw new EngineError('Project not found');
  }

  private getClientSecretFromRequest(req: EngineRequest) {
    return (
      req.engineClientSecret ||
      (this.engineConfiguration.clientSecretHeaderName &&
        req.headers?.[this.engineConfiguration.clientSecretHeaderName])
    );
  }

  private getClientIdFromRequest(req: EngineRequest) {
    return (
      req.engineClientId ||
      (this.engineConfiguration.clientIdHeaderName && req.headers?.[this.engineConfiguration.clientIdHeaderName])
    );
  }

  async getOrCreateDefaultProject() {
    if (
      this.engineStaticEnvironments.defaultProject?.name &&
      this.engineStaticEnvironments.defaultProject?.clientId &&
      this.engineStaticEnvironments.defaultProject?.clientSecret
    ) {
      const existsProject = await this.prismaClient.engineProject.findFirst({
        where: {
          clientId: this.engineStaticEnvironments.defaultProject?.clientId,
          clientSecret: this.engineStaticEnvironments.defaultProject?.clientSecret,
        },
      });
      if (existsProject) {
        return existsProject;
      }
      const result = await this.prismaClient.engineProject.create({
        data: {
          public: false,
          name: this.engineStaticEnvironments.defaultProject?.name,
          nameLocale: this.engineStaticEnvironments.defaultProject.nameLocale,
          clientId: this.engineStaticEnvironments.defaultProject?.clientId,
          clientSecret: this.engineStaticEnvironments.defaultProject?.clientSecret,
        },
      });

      await this.engineTemplatesService.createProjectDefaultEmailTemplates(result.id);
      await this.engineCacheService.clearCacheProjectByClientId(this.engineStaticEnvironments.defaultProject?.clientId);

      const project = await this.engineCacheService.getCachedProject(
        this.engineStaticEnvironments.defaultProject?.clientId,
      );

      this.logger.log('Default project created!');

      return project;
    }
    return null;
  }
}
