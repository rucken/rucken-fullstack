/* eslint-disable @typescript-eslint/no-explicit-any */
import { InjectPrismaClient } from '@nestjs-mod/prisma';
import { Injectable, Logger } from '@nestjs/common';
import ms from 'ms';
import { TranslatesAsyncLocalStorageContext } from 'nestjs-translates';
import { PrismaClient, EngineUser } from '../generated/prisma-client';
import { OperationName, EngineConfiguration, EngineSendNotificationOptions } from '../engine.configuration';
import { DEFAULT_EMAIL_TEMPLATE_BY_NAMES, RUCKEN_ENGINE_FEATURE } from '../engine.constants';
import { EngineStaticEnvironments } from '../engine.environments';
import { CompleteForgotPasswordArgs, ForgotPasswordArgs } from '../types/forgot-password.dto';
import { SignInArgs } from '../types/sign-in.dto';
import { SignUpArgs } from '../types/sign-up.dto';
import { EngineRequest } from '../types/engine-request';
import { EngineCacheService } from './engine-cache.service';
import { EngineCookieService } from './engine-cookie.service';
import { EngineTemplatesService } from './engine-templates.service';
import { EngineTokensService } from './engine-tokens.service';
import { EngineUsersService } from './engine-users.service';

@Injectable()
export class EngineService {
  private logger = new Logger(EngineService.name);

  constructor(
    @InjectPrismaClient(RUCKEN_ENGINE_FEATURE)
    private readonly prismaClient: PrismaClient,
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
    private readonly engineConfiguration: EngineConfiguration,
    private readonly engineUsersService: EngineUsersService,
    private readonly engineCookieService: EngineCookieService,
    private readonly translatesAsyncLocalStorageContext: TranslatesAsyncLocalStorageContext,
    private readonly engineTokensService: EngineTokensService,
    private readonly engineCacheService: EngineCacheService,
    private readonly engineTemplatesService: EngineTemplatesService,
  ) {}

  signIn({ signInArgs, projectId }: { signInArgs: SignInArgs; projectId: string }) {
    return this.engineUsersService.getByEmailAndPassword({
      email: signInArgs.email,
      password: signInArgs.password,
      projectId,
    });
  }

  async autoSignUp({
    email,
    password,
    username,
    projectId,
    firstname,
    lastname,
    picture,
  }: {
    email: string;
    password: string;
    username?: string;
    projectId: string;
    firstname?: string;
    lastname?: string;
    picture?: string;
  }) {
    return await this.engineUsersService.create({
      user: {
        email,
        username,
        password,
        emailVerifiedAt: new Date(),
        firstname,
        lastname,
        picture,
      },
      projectId,
      roles: this.engineStaticEnvironments.userDefaultRoles,
    });
  }

  async signUp({
    signUpArgs,
    projectId,
    operationName,
  }: {
    signUpArgs: SignUpArgs;
    projectId: string;
    operationName: OperationName;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fingerprint, confirmPassword, ...data } = signUpArgs;
    let user = await this.engineUsersService.create({
      user: {
        ...data,
        emailVerifiedAt:
          this.engineConfiguration.twoFactorCodeGenerate && this.engineConfiguration.sendNotification
            ? null
            : new Date(),
      },
      projectId,
      roles: this.engineStaticEnvironments.userDefaultRoles,
    });

    if (this.engineConfiguration.twoFactorCodeGenerate) {
      const sendNotificationOptions: EngineSendNotificationOptions =
        operationName === OperationName.VERIFY_EMAIL
          ? await this.getCompleteSignUpOptions({ projectId, user, signUpArgs })
          : await this.getCompleteRegistrationUsingTheInvitationLinkOptions({
              projectId,
              user,
              signUpArgs,
            });

      if (this.engineConfiguration.sendNotification) {
        const result = await this.engineConfiguration.sendNotification(sendNotificationOptions);
        if (!result || this.engineStaticEnvironments.disableEmailVerification) {
          user = await this.prismaClient.engineUser.update({
            include: { EngineProject: true },
            data: {
              emailVerifiedAt: new Date(),
            },
            where: { id: user.id, projectId },
          });
          await this.engineCacheService.clearCacheByUserId({ userId: user.id });
        }
      } else {
        this.logger.debug({
          sendNotification: sendNotificationOptions,
        });
      }
    }

    return user;
  }

  private async getCompleteSignUpOptions({
    projectId,
    user,
    signUpArgs,
  }: {
    projectId: string;
    user: EngineUser;
    signUpArgs: SignUpArgs;
  }) {
    const project = await this.prismaClient.engineProject.findFirst({
      where: { id: { equals: projectId } },
    });
    const { operationName, subject, text, html } = await this.getSendNotificationOptions(
      OperationName.VERIFY_EMAIL,
      projectId,
    );

    const code = this.engineConfiguration.twoFactorCodeGenerate
      ? await this.engineConfiguration.twoFactorCodeGenerate({
          user,
          operationName: OperationName.VERIFY_EMAIL,
        })
      : 'undefined';

    const link = signUpArgs.redirectUri
      ? `${this.engineStaticEnvironments.clientUrl}/complete-sign-up?code=${code}&redirect_uri=${signUpArgs.redirectUri}&client_id=${project?.clientId}`
      : `${this.engineStaticEnvironments.clientUrl}/complete-sign-up?code=${code}&client_id=${project?.clientId}`;
    const sendNotificationOptions: EngineSendNotificationOptions = {
      recipientUsers: [user],
      subject: this.translatesAsyncLocalStorageContext.get().translate(subject),
      text: this.translatesAsyncLocalStorageContext.get().translate(text),
      html: this.translatesAsyncLocalStorageContext.get().translate(html, {
        link,
      }),
      operationName,
      projectId,
    };
    return sendNotificationOptions;
  }

  private async getCompleteRegistrationUsingTheInvitationLinkOptions({
    projectId,
    user,
    signUpArgs,
  }: {
    projectId: string;
    user: EngineUser;
    signUpArgs: SignUpArgs;
  }) {
    const project = await this.prismaClient.engineProject.findFirst({
      where: { id: { equals: projectId } },
    });
    const { operationName, subject, text, html } = await this.getSendNotificationOptions(
      OperationName.COMPLETE_REGISTRATION_USING_THE_INVITATION_LINK,
      projectId,
    );

    const code = this.engineConfiguration.twoFactorCodeGenerate
      ? await this.engineConfiguration.twoFactorCodeGenerate({
          user,
          operationName: OperationName.COMPLETE_REGISTRATION_USING_THE_INVITATION_LINK,
        })
      : 'undefined';

    const link = signUpArgs.redirectUri
      ? `${this.engineStaticEnvironments.clientUrl}/complete-invite?code=${code}&redirect_uri=${signUpArgs.redirectUri}&client_id=${project?.clientId}`
      : `${this.engineStaticEnvironments.clientUrl}/complete-invite?code=${code}&client_id=${project?.clientId}`;
    const sendNotificationOptions: EngineSendNotificationOptions = {
      recipientUsers: [user],
      subject: this.translatesAsyncLocalStorageContext.get().translate(subject),
      text: this.translatesAsyncLocalStorageContext.get().translate(text),
      html: this.translatesAsyncLocalStorageContext.get().translate(html, {
        link,
      }),
      operationName,
      projectId,
    };
    return sendNotificationOptions;
  }

  private async getSendNotificationOptions(operationName: OperationName, projectId: string) {
    const defaultLocale = this.translatesAsyncLocalStorageContext.get().config?.defaultLocale || 'en';
    const locale = this.translatesAsyncLocalStorageContext.get().locale || defaultLocale;

    const template = await this.engineTemplatesService.getEmailTemplate({
      operationName,
      projectId,
    });
    const defaultTemplate = DEFAULT_EMAIL_TEMPLATE_BY_NAMES[operationName];

    const subject =
      (locale === defaultLocale ? template?.subject : (template?.subjectLocale as any)?.[locale]) ||
      defaultTemplate.subject;

    const text =
      (locale === defaultLocale ? template?.text : (template?.textLocale as any)?.[locale]) || defaultTemplate.text;
    const html =
      (locale === defaultLocale ? template?.html : (template?.htmlLocale as any)?.[locale]) || defaultTemplate.html;
    return { operationName, subject, text, html };
  }

  async completeSignUp({ code, projectId }: { code: string; projectId: string }) {
    const twoFactorCodeValidateResult = this.engineConfiguration.twoFactorCodeValidate
      ? await this.engineConfiguration.twoFactorCodeValidate({
          code,
          projectId,
          operationName: OperationName.VERIFY_EMAIL,
        })
      : null;

    if (!twoFactorCodeValidateResult) {
      return twoFactorCodeValidateResult;
    }

    this.logger.debug({
      completeSignUp: {
        code,
        projectId,
        result: twoFactorCodeValidateResult,
      },
    });

    const result = await this.prismaClient.engineUser.update({
      where: { id: twoFactorCodeValidateResult.userId, projectId },
      data: { emailVerifiedAt: new Date(), updatedAt: new Date() },
    });

    await this.engineCacheService.clearCacheByUserId({
      userId: twoFactorCodeValidateResult.userId,
    });

    return result;
  }

  async forgotPassword({
    forgotPasswordArgs,
    engineRequest,
    projectId,
  }: {
    forgotPasswordArgs: ForgotPasswordArgs;
    engineRequest: EngineRequest;
    projectId: string;
  }) {
    const project = await this.prismaClient.engineProject.findFirst({
      where: { id: { equals: projectId } },
    });
    const user = await this.engineUsersService.getByEmail({
      email: forgotPasswordArgs.email,
      projectId,
    });
    if (this.engineConfiguration.twoFactorCodeGenerate) {
      const { operationName, subject, text, html } = await this.getSendNotificationOptions(
        OperationName.COMPLETE_FORGOT_PASSWORD,
        projectId,
      );

      const code = await this.engineConfiguration.twoFactorCodeGenerate({
        ...engineRequest,
        user,
        operationName: OperationName.COMPLETE_FORGOT_PASSWORD,
      });

      const link = forgotPasswordArgs.redirectUri
        ? `${this.engineStaticEnvironments.clientUrl}/complete-forgot-password?code=${code}&redirect_uri=${forgotPasswordArgs.redirectUri}&client_id=${project?.clientId}`
        : `${this.engineStaticEnvironments.clientUrl}/complete-forgot-password?code=${code}&client_id=${project?.clientId}`;
      if (this.engineConfiguration.sendNotification) {
        await this.engineConfiguration.sendNotification({
          projectId,
          recipientUsers: [user],
          subject: this.translatesAsyncLocalStorageContext.get().translate(subject),
          text: this.translatesAsyncLocalStorageContext.get().translate(text, {
            link,
          }),
          html: this.translatesAsyncLocalStorageContext.get().translate(html, {
            link,
          }),
          operationName,
        });
      }
    }
  }

  async completeForgotPassword({
    completeForgotPasswordArgs,
    projectId,
  }: {
    completeForgotPasswordArgs: CompleteForgotPasswordArgs;
    projectId: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fingerprint, confirmPassword, ...data } = completeForgotPasswordArgs;
    if (this.engineConfiguration.twoFactorCodeValidate) {
      const result = await this.engineConfiguration.twoFactorCodeValidate({
        code: completeForgotPasswordArgs.code,
        projectId,
        operationName: OperationName.COMPLETE_FORGOT_PASSWORD,
      });
      return this.engineUsersService.changePassword({
        id: result.userId,
        password: data.password,
        projectId,
      });
    }
    return null;
  }

  update({
    user,
    projectId,
  }: {
    user: Pick<
      EngineUser,
      'birthdate' | 'firstname' | 'lastname' | 'id' | 'picture' | 'gender' | 'lang' | 'timezone'
    > & {
      password: string | null;
      oldPassword: string | null;
    };
    projectId: string;
  }) {
    return this.engineUsersService.update({
      user,
      projectId,
    });
  }

  async refreshTokens({
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
    const tokens = await this.engineTokensService.getAccessAndRefreshTokensByRefreshToken({
      refreshToken,
      userIp,
      userAgent,
      fingerprint,
      projectId,
    });
    const cookie = this.engineCookieService.getCookie({
      name: 'refreshToken',
      value: tokens.refreshToken,
      options: {
        ['max-age']: Math.round(ms(this.engineStaticEnvironments.jwtRefreshTokenExpiresIn) / 1000),
        path: '/',
        httponly: true,
        signed: true,
        sameSite: true,
      },
    });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      cookie,
      user: tokens.user,
    };
  }
}
