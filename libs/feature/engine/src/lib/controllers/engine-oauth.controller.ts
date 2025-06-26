import { WebhookService } from '@nestjs-mod/webhook';
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { omit } from 'lodash/fp';
import { IpAddress } from '../decorators/ip-address.decorator';
import { UserAgent } from '../decorators/user-agent.decorator';
import { PrismaClient } from '../generated/prisma-client';
import { EngineCookieService } from '../services/engine-cookie.service';
import { EngineEventsService } from '../services/engine-events.service';
import { RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { AllowEmptyEngineUser, CurrentEngineRequest } from '../engine.decorators';
import { EngineStaticEnvironments } from '../engine.environments';
import { EngineError, EngineErrorEnum } from '../engine.errors';
import { OAuthProvider } from '../types/engine-oauth-provider.dto';
import { EngineOAuthVerificationArgs } from '../types/engine-oauth-verification.dto';
import { EngineRequest } from '../types/engine-request';
import { EngineWebhookEvent } from '../types/engine-webhooks';
import { TokensResponse } from '../types/tokens.dto';

@ApiTags('Engine')
@AllowEmptyEngineUser()
@Controller('/engine/oauth')
export class EngineOAuthController {
  private readonly logger = new Logger(EngineOAuthController.name);

  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly engineCookieService: EngineCookieService,
    private readonly engineEventsService: EngineEventsService,
    private readonly webhookService: WebhookService,
    private readonly prismaToolsService: PrismaToolsService,
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
  ) {}

  @ApiOkResponse({ type: OAuthProvider, isArray: true })
  @Get('providers')
  async oauthProviders(@CurrentEngineRequest() engineRequest: EngineRequest): Promise<OAuthProvider[]> {
    const domain = this.engineStaticEnvironments.serverUrl;
    const providers = await this.prismaClient.engineOAuthProvider.findMany({});
    return providers.map((provider) => ({
      ...provider,
      url: `${domain}/api/engine/oauth/${provider.name}?redirect_uri=${encodeURIComponent(
        `${domain}/api/engine/oauth/${provider.name}/redirect?client_id=${engineRequest.engineClientId}`,
      )}`,
    }));
  }

  @ApiOkResponse({ type: TokensResponse })
  @HttpCode(HttpStatus.OK)
  @Post('verification')
  async oauthVerification(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() engineOAuthVerificationArgs: EngineOAuthVerificationArgs,
    @Res({ passthrough: true }) response: Response,
    @IpAddress() userIp: string,
    @UserAgent() userAgent: string,
  ) {
    try {
      let oAuthToken = await this.prismaClient.engineOAuthToken.findFirstOrThrow({
        include: { EngineUser: true },
        where: { verificationCode: engineOAuthVerificationArgs.verificationCode },
      });

      const user = await this.prismaClient.engineUser.update({
        data: {
          EngineProject: {
            connect: { id: engineRequest.engineProject.id },
          },
        },
        where: { id: oAuthToken.userId },
      });

      oAuthToken = await this.prismaClient.engineOAuthToken.update({
        include: { EngineUser: true },
        data: {
          verificationCode: null,
          projectId: user.projectId,
        },
        where: { id: oAuthToken?.id },
      });

      await this.webhookService.sendEvent({
        eventName: EngineWebhookEvent['engine.sign-in'],
        eventBody: omit(['password'], oAuthToken.EngineUser),
        eventHeaders: { projectId: user.projectId },
      });

      if (oAuthToken.EngineUser.emailVerifiedAt === null) {
        this.logger.debug({
          signIn: {
            EngineOAuthVerification: engineOAuthVerificationArgs,
            projectId: user.projectId,
          },
        });
        throw new EngineError(EngineErrorEnum.EmailNotVerified);
      } else {
        await this.engineEventsService.send({
          OAuthVerification: {
            oAuthVerificationArgs: engineOAuthVerificationArgs,
          },
          userId: oAuthToken.userId,
          userIp,
          userAgent,
        });
      }

      const cookieWithJwtToken = await this.engineCookieService.getCookieWithJwtToken({
        userId: oAuthToken.userId,
        userIp,
        userAgent,
        fingerprint: engineOAuthVerificationArgs.fingerprint,
        roles: oAuthToken.EngineUser.roles,
        projectId: user.projectId,
      });

      response.setHeader('Set-Cookie', cookieWithJwtToken.cookie);

      const result: TokensResponse = {
        user: oAuthToken.EngineUser,
        accessToken: cookieWithJwtToken.accessToken,
        refreshToken: cookieWithJwtToken.refreshToken,
      };
      response.send(result);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        this.logger.error(err, err.stack);
        throw new EngineError(EngineErrorEnum.VerificationCodeNotFound);
      }
      this.logger.error(err, err.stack);
      throw err;
    }
  }
}
