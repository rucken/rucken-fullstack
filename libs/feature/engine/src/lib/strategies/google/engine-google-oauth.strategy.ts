import { isInfrastructureMode } from '@nestjs-mod/common';
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { PrismaToolsService } from '@nestjs-mod/prisma-tools';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Request } from 'express';
import { render } from 'mustache';
import { randomUUID } from 'node:crypto';
import passport from 'passport';
import { GoogleCallbackParameters, Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaClient, EngineOAuthProvider, EngineOAuthProviderSettings } from '../../generated/prisma-client';
import { EngineService } from '../../services/engine.service';
import { RUCKEN_ENGINE_FEATURE } from '../../engine.constants';
import { EngineStaticEnvironments } from '../../engine.environments';
import { EngineRequest } from '../../types/engine-request';

// https://console.cloud.google.com/apis/credentials
// https://myaccount.google.com/permissions
// http://localhost:3000/api/engine/oauth/google?redirect_uri=https%3A%2F%2Fengine.nestjs-mod.com%2Fapi%2Fengine%2Foauth%2Fgoogle%2Fredirect%3Fclient_id%3DOceX08HGZ89PTkPpg9KDk5ErY1uMfDcfFKkw
// http://localhost:3000/complete-oauth-sign-up?verification_code=d4315edf-5460-450f-b133-0eba62c79605
@Injectable()
export class EngineGoogleOAuthStrategy implements OnModuleInit {
  static oauthProviderName = 'google';
  readonly oauthProviderName = 'google';

  private logger = new Logger(EngineGoogleOAuthStrategy.name);

  private readonly clientIDKey = 'GOOGLE_OAUTH_CLIENT_ID';
  private readonly clientSecretKey = 'GOOGLE_OAUTH_CLIENT_SECRET_KEY';

  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly prismaToolsService: PrismaToolsService,
    private readonly engineService: EngineService,
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
  ) {}

  public async getProvider(): Promise<
    | (EngineOAuthProvider & {
        EngineOAuthProviderSettings: EngineOAuthProviderSettings[];
      })
    | null
  > {
    try {
      return await this.prismaClient.engineOAuthProvider.findFirstOrThrow({
        where: { name: this.oauthProviderName },
        include: { EngineOAuthProviderSettings: true },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        try {
          const googleOauthClientId = this.engineStaticEnvironments.googleOauthClientId;
          const googleOauthClientSecretKey = this.engineStaticEnvironments.googleOauthClientSecretKey;

          return await this.prismaClient.engineOAuthProvider.create({
            include: { EngineOAuthProviderSettings: true },
            data: {
              name: this.oauthProviderName,
              EngineOAuthProviderSettings: {
                create: [
                  {
                    name: this.clientIDKey,
                    value: googleOauthClientId || '',
                  },
                  {
                    name: this.clientSecretKey,
                    value: googleOauthClientSecretKey || '',
                  },
                ],
              },
            },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          if (this.prismaToolsService.isErrorOfUniqueField<EngineOAuthProvider>(err, 'name', true)) {
            return null;
          }
          throw err;
        }
      }
      throw err;
    }
  }

  async onModuleInit() {
    this.logger.debug('onModuleInit');

    if (isInfrastructureMode()) {
      return;
    }

    const options = await this.getProviderOptions();
    if (!options) {
      this.logger.warn('Options not set');
      return;
    }

    passport.use(
      this.oauthProviderName,
      new Strategy(
        { ...options, passReqToCallback: true },
        (
          req: Request,
          accessToken: string,
          refreshToken: string,
          params: GoogleCallbackParameters,
          profile: Profile,
          done: VerifyCallback,
        ) => {
          this.verify({
            req,
            accessToken,
            refreshToken,
            profile,
            providerId: options.providerId,
          })
            .then((result) => done(null, result))
            .catch((err) => done(err, undefined));
        },
      ),
    );
  }

  private async verify({
    req,
    accessToken,
    refreshToken,
    profile,
    providerId,
  }: {
    req: Request;
    accessToken: string;
    refreshToken: string;
    profile: Profile;
    providerId: string;
  }) {
    const projectId = (req as unknown as EngineRequest).engineProject?.id;
    const verificationCode = randomUUID();
    this.logger.debug(JSON.stringify({ projectId, profile, verificationCode }));
    if (!profile.id) {
      return undefined;
    }
    try {
      const oAuthToken = await this.prismaClient.engineOAuthToken.findFirstOrThrow({
        include: {
          EngineUser: {
            select: {
              picture: true,
              firstname: true,
              lastname: true,
            },
          },
        },
        where: {
          providerUserId: String(profile.id),
          providerId,
        },
      });
      const user = await this.prismaClient.engineUser.update({
        where: {
          id: oAuthToken.userId,
        },
        data: {
          picture:
            oAuthToken.EngineUser.picture ||
            (profile.photos && profile.photos.length && profile.photos[0].value) ||
            null,
          firstname: oAuthToken.EngineUser.firstname || profile.name?.givenName || null,
          lastname: oAuthToken.EngineUser.lastname || profile.name?.familyName || null,
        },
      });
      await this.prismaClient.engineOAuthToken.update({
        where: {
          id: oAuthToken.id,
        },
        data: {
          accessToken,
          refreshToken,
          verificationCode,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          providerUserData: profile as any,
        },
      });
      return { ...user, verificationCode };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
        const username =
          (profile.displayName && profile.displayName.split(' ').join('_').toLowerCase()) ||
          `${this.oauthProviderName}_${profile.id}`;
        const email =
          (profile.emails && profile.emails.length && profile.emails[0]?.value) ||
          `${this.oauthProviderName}_${profile.id}`;

        const password = `${this.oauthProviderName}_${profile.id}`;

        try {
          const user = await this.prismaClient.engineUser.findFirstOrThrow({
            where: { email, projectId },
          });
          await this.prismaClient.engineOAuthToken.create({
            data: {
              accessToken,
              refreshToken,
              providerUserId: String(profile.id),
              providerId,
              projectId,
              userId: user.id,
              verificationCode,
            },
          });
          return { ...user, verificationCode };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          this.logger.error(err, err.stack);
          if (this.prismaToolsService.isErrorOfRecordNotFound(err)) {
            const user = await this.engineService.autoSignUp({
              projectId,
              email,
              password,
              username,
              picture: (profile.photos && profile.photos.length && profile.photos[0].value) || undefined,
              firstname: profile.name?.givenName || undefined,
              lastname: profile.name?.familyName || undefined,
            });
            await this.prismaClient.engineOAuthToken.create({
              data: {
                accessToken,
                refreshToken,
                providerUserId: String(profile.id),
                providerId,
                projectId,
                userId: user.id,
                verificationCode,
              },
            });
            return { ...user, verificationCode };
          }
          throw err;
        }
      }
      this.logger.error(err, err.stack);
      throw err;
    }
  }

  public async getProviderOptions(): Promise<{
    providerId: string;
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  } | null> {
    const domain = this.engineStaticEnvironments.serverUrl;
    const redirectUrl = '{{{domain}}}/api/engine/oauth/{{providerName}}/redirect';
    const provider = await this.getProvider();

    if (!provider) {
      return null;
    }
    const context = {
      providerName: provider?.name,
      domain,
    };

    const engineOAuthProviderSettings = provider.EngineOAuthProviderSettings || [];
    const clientID = engineOAuthProviderSettings.find((s) => s.name === this.clientIDKey)?.value || '';
    const clientSecret = engineOAuthProviderSettings.find((s) => s.name === this.clientSecretKey)?.value || '';

    if (!clientID || !clientSecret) {
      return null;
    }

    try {
      const callbackURL = render(redirectUrl, context);
      return {
        providerId: provider.id,
        clientID,
        clientSecret,
        callbackURL,
        scope: ['email', 'profile'],
      };
    } catch (err) {
      throw Error(`Error in render callbackURL from template: "${redirectUrl}",  context: "${context}"`);
    }
  }
}
