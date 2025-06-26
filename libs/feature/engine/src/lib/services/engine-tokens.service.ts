import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addMilliseconds } from 'date-fns';
import ms from 'ms';
import { randomUUID } from 'node:crypto';
import { PrismaClient, EngineRefreshSession, EngineUser } from '../generated/prisma-client';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { EngineStaticEnvironments } from '../engine.environments';
import { EngineError, EngineErrorEnum } from '../engine.errors';
import { EngineAccessTokenData } from '../types/engine-request';
import { EngineCacheService } from './engine-cache.service';

@Injectable()
export class EngineTokensService {
  private logger = new Logger(EngineTokensService.name);

  constructor(
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
    private readonly jwtService: JwtService,
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly prismaToolsService: PrismaToolsService,
    private readonly engineCacheService: EngineCacheService,
  ) {}

  async getAccessAndRefreshTokensByRefreshToken({
    refreshToken,
    userIp,
    userAgent,
    fingerprint,
    projectId,
  }: {
    refreshToken: string;
    userIp: string;
    userAgent: string;
    fingerprint: string;
    projectId: string;
  }) {
    const expiresAt = addMilliseconds(new Date(), ms(this.engineStaticEnvironments.jwtRefreshTokenExpiresIn));
    let currentRefreshSession: EngineRefreshSession & { EngineUser: EngineUser };
    try {
      currentRefreshSession = await this.prismaClient.engineRefreshSession.findFirstOrThrow({
        include: { EngineUser: true },
        where: { fingerprint, refreshToken, enabled: true },
      });
      // if (
      //   !currentRefreshSession.EngineUser.roles
      //     ?.split(',')
      //     .find((r) =>
      //       this.engineStaticEnvironments.adminDefaultRoles?.includes(r)
      //     ) &&
      //   currentRefreshSession.projectId !== projectId
      // ) {
      //   throw new EngineError(EngineErrorEnum.RefreshTokenNotProvided);
      // }
      projectId = currentRefreshSession.projectId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        this.logger.debug({
          fingerprint,
          refreshToken,
          projectId,
          enabled: true,
        });
        throw new EngineError(EngineErrorEnum.RefreshTokenNotProvided);
      }
      this.logger.error(err, err.stack);
      throw err;
    }
    try {
      await this.prismaClient.engineRefreshSession.updateMany({
        data: { enabled: false },
        where: { fingerprint, refreshToken },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.logger.error(err, err.stack);
    }

    this.verifyRefreshSession({
      oldRefreshSession: currentRefreshSession,
      newFingerprint: fingerprint,
      newIp: userIp,
    });

    refreshToken = randomUUID();

    const session = await this.prismaClient.engineRefreshSession.create({
      include: { EngineUser: true },
      data: {
        refreshToken,
        userId: currentRefreshSession.userId,
        userIp,
        userAgent,
        fingerprint,
        expiresAt,
        projectId,
        enabled: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userData: currentRefreshSession.userData as any,
      },
    });

    // fill cache
    await this.engineCacheService.getCachedRefreshSession(refreshToken);

    const accessTokenData: EngineAccessTokenData = {
      userId: session.userId,
      projectId: session.projectId,
      refreshToken,
      ...(currentRefreshSession.EngineUser.roles ? { roles: currentRefreshSession.EngineUser.roles } : {}),
    };

    const accessToken = this.jwtService.sign(accessTokenData, {
      expiresIn: this.engineStaticEnvironments.jwtAccessTokenExpiresIn,
      secret: this.engineStaticEnvironments.jwtSecretKey,
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
      user: session.EngineUser,
    };
  }

  verifyRefreshSession({
    oldRefreshSession,
    newFingerprint,
    newIp,
  }: {
    oldRefreshSession: EngineRefreshSession;
    newFingerprint?: string;
    newIp?: string;
  }) {
    const nowTime = new Date();
    if (!oldRefreshSession.expiresAt || +nowTime > +new Date(oldRefreshSession.expiresAt)) {
      this.logger.debug({
        verifyRefreshSession: {
          expiresAt: oldRefreshSession.expiresAt,
          nowTime,
        },
      });
      throw new EngineError(EngineErrorEnum.SessionExpired);
    }
    if (newFingerprint && newIp) {
      if (oldRefreshSession.userIp !== newIp || oldRefreshSession.fingerprint !== newFingerprint) {
        this.logger.debug({ oldRefreshSession, newFingerprint, newIp });
        throw new EngineError(EngineErrorEnum.InvalidRefreshSession);
      }
    }
  }

  async getAccessAndRefreshTokensByUserId(
    {
      userId,
      userIp,
      userAgent,
      fingerprint,
      roles,
    }: {
      userId: string;
      userIp: string;
      userAgent: string;
      fingerprint: string;
      roles: string | null;
    },
    projectId: string,
  ) {
    const expiresAt = addMilliseconds(new Date(), ms(this.engineStaticEnvironments.jwtRefreshTokenExpiresIn));
    try {
      const sessions = await this.prismaClient.engineRefreshSession.findMany({
        select: { id: true, refreshToken: true },
        where: {
          userId,
          fingerprint,
          projectId,
        },
      });

      for (const session of sessions) {
        await this.prismaClient.engineRefreshSession.update({
          data: { enabled: false },
          where: { id: session.id, projectId },
        });

        await this.engineCacheService.clearCacheByRefreshSession(session.refreshToken);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.logger.error(err, err.stack);
    }
    const refreshToken = randomUUID();
    const session = await this.prismaClient.engineRefreshSession.create({
      data: {
        refreshToken,
        userId,
        userIp,
        userAgent,
        fingerprint,
        expiresAt,
        projectId,
        enabled: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userData: { roles } as any,
      },
    });
    const accessTokenData: EngineAccessTokenData = {
      userId,
      projectId,
      refreshToken,
      ...(roles ? { roles } : {}),
    };
    return {
      accessToken: this.jwtService.sign(accessTokenData, {
        expiresIn: this.engineStaticEnvironments.jwtAccessTokenExpiresIn,
        secret: this.engineStaticEnvironments.jwtSecretKey,
      }),
      refreshToken: session.refreshToken,
    };
  }

  async disableRefreshSessionByRefreshToken({ refreshToken, projectId }: { refreshToken: string; projectId: string }) {
    try {
      const refreshSession = await this.prismaClient.engineRefreshSession.findFirstOrThrow({
        where: {
          refreshToken,
        },
      });

      this.prismaClient.engineRefreshSession.updateMany({
        data: { enabled: false },
        where: { refreshToken },
      });

      await this.engineCacheService.clearCacheByRefreshSession(refreshToken);

      return refreshSession;
    } catch (err) {
      this.logger.debug({ refreshToken, projectId });
      throw new EngineError(EngineErrorEnum.RefreshTokenNotProvided);
    }
  }

  async verifyAndDecodeAccessToken(accessToken: string | undefined) {
    if (accessToken === 'undefined') {
      accessToken = undefined;
    }
    try {
      return accessToken
        ? await this.jwtService.verifyAsync<EngineAccessTokenData>(accessToken, {
            secret: this.engineStaticEnvironments.jwtSecretKey,
          })
        : undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message.includes('jwt expired')) {
        throw new EngineError(EngineErrorEnum.AccessTokenExpired);
      }
      this.logger.error(err, err.stack);
      throw new EngineError(EngineErrorEnum.BadAccessToken);
    }
  }
}
