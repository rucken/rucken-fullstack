import { StatusResponse } from '@nestjs-mod/swagger';
import { ValidationError, ValidationErrorEnum } from '@nestjs-mod/validation';
import { WebhookService } from '@nestjs-mod/webhook';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { omit } from 'lodash/fp';
import { InjectTranslateFunction, TranslateFunction, TranslatesStorage } from 'nestjs-translates';
import assert from 'node:assert';
import { Cookies } from '../decorators/cookie.decorator';
import { IpAddress } from '../decorators/ip-address.decorator';
import { UserAgent } from '../decorators/user-agent.decorator';
import { EngineUserDto } from '../generated/rest/dto/engine-user.dto';
import { EngineCacheService } from '../services/engine-cache.service';
import { EngineCookieService } from '../services/engine-cookie.service';
import { EngineEventsService } from '../services/engine-events.service';
import { EngineService } from '../services/engine.service';
import { OperationName } from '../engine.configuration';
import { AllowEmptyEngineUser, CurrentEngineRequest, SkipValidateRefreshSession } from '../engine.decorators';
import { EngineError, EngineErrorEnum } from '../engine.errors';
import { CompleteForgotPasswordArgs, ForgotPasswordArgs } from '../types/forgot-password.dto';
import { RefreshTokensResponse } from '../types/refresh-tokens.dto';
import { SignInArgs } from '../types/sign-in.dto';
import { SignOutArgs } from '../types/sign-out.dto';
import { CompleteSignUpArgs, SignUpArgs } from '../types/sign-up.dto';
import { EngineRequest } from '../types/engine-request';
import { EngineWebhookEvent } from '../types/engine-webhooks';
import { TokensResponse } from '../types/tokens.dto';
import { UpdateProfileArgs } from '../types/update-profile.dto';

@ApiBadRequestResponse({
  schema: { allOf: refs(EngineError, ValidationError) },
})
@ApiTags('Engine')
@Controller('/engine')
export class EngineController {
  private logger = new Logger(EngineController.name);

  constructor(
    private readonly engineCookieService: EngineCookieService,
    private readonly engineService: EngineService,
    private readonly engineEventsService: EngineEventsService,
    private readonly webhookService: WebhookService,
    private readonly engineCacheService: EngineCacheService,
    private readonly translatesStorage: TranslatesStorage,
  ) {}

  @AllowEmptyEngineUser()
  @ApiOkResponse({ type: TokensResponse })
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() signInArgs: SignInArgs,
    @Res({ passthrough: true }) response: Response,
    @IpAddress() userIp: string,
    @UserAgent() userAgent: string,
  ): Promise<void> {
    const user = await this.engineService.signIn({
      signInArgs,
      projectId: engineRequest.engineProject.id,
    });

    await this.webhookService.sendEvent({
      eventName: EngineWebhookEvent['engine.sign-in'],
      eventBody: omit(['password'], user),
      eventHeaders: { projectId: engineRequest.engineProject.id },
    });

    if (user.emailVerifiedAt === null) {
      this.logger.debug({
        signIn: {
          signInArgs,
          projectId: engineRequest.engineProject.id,
        },
      });
      throw new EngineError(EngineErrorEnum.EmailNotVerified);
    } else {
      await this.engineEventsService.send({
        SignIn: { signInArgs },
        userId: user.id,
        userIp,
        userAgent,
      });
    }

    const cookieWithJwtToken = await this.engineCookieService.getCookieWithJwtToken({
      userId: user.id,
      userIp,
      userAgent,
      fingerprint: signInArgs.fingerprint,
      roles: user.roles,
      projectId: engineRequest.engineProject.id,
    });

    response.setHeader('Set-Cookie', cookieWithJwtToken.cookie);

    const result: TokensResponse = {
      user,
      accessToken: cookieWithJwtToken.accessToken,
      refreshToken: cookieWithJwtToken.refreshToken,
    };
    response.send(result);
  }

  @UseGuards(ThrottlerGuard)
  @AllowEmptyEngineUser()
  @ApiOkResponse({ type: TokensResponse })
  @HttpCode(HttpStatus.OK)
  @Post('sign-up')
  async signUp(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() signUpArgs: SignUpArgs,
    @Res({ passthrough: true }) response: Response,
    @IpAddress() userIp: string,
    @UserAgent() userAgent: string,
  ): Promise<void> {
    const user = await this.engineService.signUp({
      signUpArgs,
      projectId: engineRequest.engineProject.id,
      operationName: OperationName.VERIFY_EMAIL,
    });

    await this.webhookService.sendEvent({
      eventName: EngineWebhookEvent['engine.sign-up'],
      eventBody: omit(['password'], user),
      eventHeaders: { projectId: engineRequest.engineProject.id },
    });

    if (user.emailVerifiedAt === null) {
      this.logger.debug({
        signUp: {
          signUpArgs,
          projectId: engineRequest.engineProject.id,
        },
      });
      throw new EngineError(EngineErrorEnum.EmailNotVerified);
    } else {
      await this.engineEventsService.send({
        SignUp: { signUpArgs: signUpArgs },
        userId: user.id,
        userIp,
        userAgent,
      });
    }

    const cookieWithJwtToken = await this.engineCookieService.getCookieWithJwtToken({
      userId: user.id,
      userIp,
      userAgent,
      fingerprint: signUpArgs.fingerprint,
      roles: user.roles,
      projectId: engineRequest.engineProject.id,
    });

    response.setHeader('Set-Cookie', cookieWithJwtToken.cookie);

    const result: TokensResponse = {
      user,
      accessToken: cookieWithJwtToken.accessToken,
      refreshToken: cookieWithJwtToken.refreshToken,
    };
    response.send(result);
  }

  @AllowEmptyEngineUser()
  @ApiOkResponse({ type: TokensResponse })
  @HttpCode(HttpStatus.OK)
  @Post('complete-sign-up')
  async completeSignUp(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() completeSignUpArgs: CompleteSignUpArgs,
    @Res({ passthrough: true }) response: Response,
    @IpAddress() userIp: string,
    @UserAgent() userAgent: string,
  ): Promise<void> {
    const user = await this.engineService.completeSignUp({
      code: completeSignUpArgs.code,
      projectId: engineRequest.engineProject.id,
    });

    if (!user) {
      throw new EngineError(EngineErrorEnum.UserNotFound);
    }

    await this.webhookService.sendEvent({
      eventName: EngineWebhookEvent['engine.complete-sign-up'],
      eventBody: omit(['password'], user),
      eventHeaders: { projectId: engineRequest.engineProject.id },
    });

    await this.engineEventsService.send({
      CompleteSignUp: { completeSignUpArgs },
      userId: user.id,
      userIp,
      userAgent,
    });

    const cookieWithJwtToken = await this.engineCookieService.getCookieWithJwtToken({
      userId: user.id,
      userIp,
      userAgent,
      fingerprint: completeSignUpArgs.fingerprint,
      roles: user.roles,
      projectId: engineRequest.engineProject.id,
    });

    response.setHeader('Set-Cookie', cookieWithJwtToken.cookie);

    const result: TokensResponse = {
      user,
      accessToken: cookieWithJwtToken.accessToken,
      refreshToken: cookieWithJwtToken.refreshToken,
    };
    response.send(result);
  }

  @SkipValidateRefreshSession()
  @ApiOkResponse({ type: StatusResponse })
  @HttpCode(HttpStatus.OK)
  @Post('sign-out')
  async signOut(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() signOutArgs: SignOutArgs,
    @Res({ passthrough: true }) response: Response,
    @Cookies('refreshToken') cookieRefreshToken: string | null,
    @IpAddress() userIp: string,
    @UserAgent() userAgent: string,
  ): Promise<void> {
    const refreshToken = cookieRefreshToken || signOutArgs?.refreshToken;
    if (!refreshToken) {
      throw new EngineError(EngineErrorEnum.RefreshTokenNotProvided);
    }

    const cookieWithJwtToken = await this.engineCookieService.getCookieForSignOut({
      refreshToken,
      projectId: engineRequest.engineProject.id,
    });

    await this.webhookService.sendEvent({
      eventName: EngineWebhookEvent['engine.sign-out'],
      eventBody: omit(['password'], engineRequest.engineUser || {}),
      eventHeaders: { projectId: engineRequest.engineProject.id },
    });

    await this.engineEventsService.send({
      SignOut: { signOutArgs: { refreshToken } },
      userId: cookieWithJwtToken.refreshSession?.userId,
      userIp,
      userAgent,
    });

    response.setHeader('Set-Cookie', cookieWithJwtToken.cookie);

    response.send({ message: 'ok' });
  }

  @AllowEmptyEngineUser()
  @ApiOkResponse({ type: StatusResponse })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() forgotPasswordArgs: ForgotPasswordArgs,
  ): Promise<StatusResponse> {
    await this.engineService.forgotPassword({
      forgotPasswordArgs,
      engineRequest,
      projectId: engineRequest.engineProject.id,
    });

    await this.webhookService.sendEvent({
      eventName: EngineWebhookEvent['engine.forgot-password'],
      eventBody: omit(['password'], engineRequest.engineUser || {}),
      eventHeaders: { projectId: engineRequest.engineProject.id },
    });

    return { message: 'ok' };
  }

  @AllowEmptyEngineUser()
  @ApiOkResponse({ type: TokensResponse })
  @HttpCode(HttpStatus.OK)
  @Post('complete-forgot-password')
  async completeForgotPassword(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() completeForgotPasswordArgs: CompleteForgotPasswordArgs,
    @Res({ passthrough: true }) response: Response,
    @IpAddress() userIp: string,
    @UserAgent() userAgent: string,
  ): Promise<void> {
    const user = await this.engineService.completeForgotPassword({
      completeForgotPasswordArgs,
      projectId: engineRequest.engineProject.id,
    });

    if (!user) {
      throw new EngineError(EngineErrorEnum.UserNotFound);
    }

    await this.webhookService.sendEvent({
      eventName: EngineWebhookEvent['engine.complete-forgot-password'],
      eventBody: omit(['password'], engineRequest.engineUser || {}),
      eventHeaders: { projectId: engineRequest.engineProject.id },
    });

    const cookieWithJwtToken = await this.engineCookieService.getCookieWithJwtToken({
      userId: user.id,
      userIp,
      userAgent,
      fingerprint: completeForgotPasswordArgs.fingerprint,
      roles: user.roles,
      projectId: engineRequest.engineProject.id,
    });

    response.setHeader('Set-Cookie', cookieWithJwtToken.cookie);

    const result: TokensResponse = {
      user,
      accessToken: cookieWithJwtToken.accessToken,
      refreshToken: cookieWithJwtToken.refreshToken,
    };
    response.send(result);
  }

  @AllowEmptyEngineUser()
  @ApiOkResponse({ type: TokensResponse })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-tokens')
  async refreshTokens(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() refreshTokensArgs: RefreshTokensResponse,
    @Res({ passthrough: true }) response: Response,
    @Cookies('refreshToken') cookieRefreshToken: string | null,
    @IpAddress() userIp: string,
    @UserAgent() userAgent: string,
  ): Promise<void> {
    const refreshToken = cookieRefreshToken || refreshTokensArgs.refreshToken;
    if (!refreshToken) {
      throw new EngineError(EngineErrorEnum.RefreshTokenNotProvided);
    }

    const cookieWithJwtToken = await this.engineService.refreshTokens({
      refreshToken,
      userIp,
      userAgent,
      fingerprint: refreshTokensArgs.fingerprint,
      projectId: engineRequest.engineProject.id,
    });

    response.setHeader('Set-Cookie', cookieWithJwtToken.cookie);

    const result: TokensResponse = {
      user: cookieWithJwtToken.user,
      accessToken: cookieWithJwtToken.accessToken,
      refreshToken: cookieWithJwtToken.refreshToken,
    };
    response.send(result);
  }

  @ApiOkResponse({ type: EngineUserDto })
  @Get('profile')
  profile(@CurrentEngineRequest() engineRequest: EngineRequest): EngineUserDto {
    assert(engineRequest.engineUser);
    return engineRequest.engineUser;
  }

  @ApiOkResponse({ type: EngineUserDto })
  @Put('profile')
  async updateProfile(
    @CurrentEngineRequest() engineRequest: EngineRequest,
    @Body() updateProfileArgs: UpdateProfileArgs,
    @InjectTranslateFunction() getText: TranslateFunction,
  ): Promise<EngineUserDto> {
    assert(engineRequest.engineUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...profile } = updateProfileArgs;

    if (profile.lang && !this.translatesStorage.locales.includes(profile.lang)) {
      throw new ValidationError(undefined, ValidationErrorEnum.COMMON, [
        {
          property: 'lang',
          constraints: {
            isWrongEnumValue: getText('lang must have one of the values: {{values}}', {
              values: this.translatesStorage.locales.join(', '),
            }),
          },
        },
      ]);
    }

    const user = await this.engineService.update({
      user: {
        ...profile,
        id: engineRequest.engineUser.id,
      },
      projectId: engineRequest.engineProject.id,
    });

    await this.engineCacheService.clearCacheByUserId({
      userId: engineRequest.engineUser.id,
    });

    await this.webhookService.sendEvent({
      eventName: EngineWebhookEvent['engine.update-profile'],
      eventBody: omit(['password'], user),
      eventHeaders: { projectId: engineRequest.engineProject.id },
    });

    return user;
  }
}
