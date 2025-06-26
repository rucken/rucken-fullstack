import { KeyvService } from '@nestjs-mod/keyv';
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { Injectable } from '@nestjs/common';
import { PrismaClient, EngineProject, EngineRefreshSession, EngineUser } from '../generated/prisma-client';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { EngineStaticEnvironments } from '../engine.environments';

@Injectable()
export class EngineCacheService {
  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
    private readonly keyvService: KeyvService,
  ) {}

  async clearCacheByUserId({ userId }: { userId: string }) {
    await this.keyvService.delete(this.getUserCacheKey({ userId }));
  }

  async getCachedUser({ userId }: { userId: string }) {
    const cached = await this.keyvService.get<EngineUser>(this.getUserCacheKey({ userId }));
    if (cached) {
      return cached as EngineUser;
    }
    const user = await this.prismaClient.engineUser.findFirst({
      where: {
        id: userId,
      },
    });
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...cachedUser } = user;
      await this.keyvService.set(this.getUserCacheKey({ userId }), cachedUser, this.engineStaticEnvironments.cacheTTL);
      return cachedUser;
    }
    return undefined;
  }

  private getUserCacheKey({ userId }: { userId: string }): string {
    return `engineUser.${userId}`;
  }

  //

  async clearCacheProjectByClientId(clientId: string) {
    await this.keyvService.delete(this.getProjectCacheKey(clientId));
  }

  async getCachedProject(clientId: string) {
    const cached = await this.keyvService.get<EngineProject>(this.getProjectCacheKey(clientId));
    if (cached) {
      return cached as EngineProject;
    }
    const project = await this.prismaClient.engineProject.findFirst({
      where: {
        clientId,
      },
    });
    if (project) {
      await this.keyvService.set(this.getProjectCacheKey(clientId), project, this.engineStaticEnvironments.cacheTTL);
      return project;
    }
    return undefined;
  }

  private getProjectCacheKey(clientId: string): string {
    return `engineProject.${clientId}`;
  }
  //

  async clearCacheByRefreshSession(refreshToken: string) {
    await this.keyvService.delete(this.getRefreshSessionCacheKey(refreshToken));
  }

  async getCachedRefreshSession(refreshToken: string) {
    const cached = await this.keyvService.get<EngineRefreshSession>(this.getRefreshSessionCacheKey(refreshToken));
    if (cached) {
      return cached as EngineRefreshSession;
    }
    const refreshSession = await this.prismaClient.engineRefreshSession.findFirst({
      where: {
        refreshToken,
      },
    });
    if (refreshSession) {
      await this.keyvService.set(
        this.getRefreshSessionCacheKey(refreshToken),
        refreshSession,
        this.engineStaticEnvironments.cacheTTL,
      );
      return refreshSession;
    }
    return undefined;
  }

  private getRefreshSessionCacheKey(refreshToken: string): string {
    return `engineRefreshSession.${refreshToken}`;
  }
}
