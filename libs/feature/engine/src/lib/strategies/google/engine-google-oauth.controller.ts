import { Controller, Get, Logger, Next, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { render } from 'mustache';
import passport from 'passport';
import { AllowEmptyEngineUser } from '../../engine.decorators';
import { EngineError } from '../../engine.errors';
import { EngineGoogleOAuthStrategy } from './engine-google-oauth.strategy';
import { EngineStaticEnvironments } from '../../engine.environments';

@ApiTags('Engine')
@AllowEmptyEngineUser()
@Controller('/engine/oauth/google')
export class EngineGoogleOAuthController {
  logger = new Logger(EngineGoogleOAuthController.name);
  constructor(private readonly engineStaticEnvironments: EngineStaticEnvironments) {}

  @Get()
  googleAuth(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Next() next: any,
    @Query('redirect_uri') redirectUrl: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query('client_id') clientId: string,
  ): void {
    try {
      passport.authenticate(EngineGoogleOAuthStrategy.oauthProviderName, {
        successRedirect: redirectUrl,
        failureRedirect: redirectUrl,
        passReqToCallback: true,
      })(req, res, next);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      throw new EngineError(err.message);
    }
  }

  @Get('redirect')
  @UseGuards(AuthGuard(EngineGoogleOAuthStrategy.oauthProviderName))
  async googleAuthRedirect(
    @Query('redirect_uri') redirectUrl: string,
    @Query('client_id') clientId: string,
    @Req() req: { user: { verificationCode: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const domain = this.engineStaticEnvironments.clientUrl;
    const redirectUrlAfterLogin = clientId
      ? `{{{domain}}}/complete-oauth-sign-up?verification_code={{verificationCode}}&client_id=${clientId}`
      : `{{{domain}}}/complete-oauth-sign-up?verification_code={{verificationCode}}`;
    const context = {
      verificationCode: req?.user?.verificationCode || 'Error',
      domain,
    };
    try {
      const url = render(redirectUrlAfterLogin, context);
      if (!req?.user?.verificationCode) {
        this.logger.error(`User verification code not detected`);
      }
      res.redirect(url);
    } catch (error) {
      throw Error(`Error in render url from template: "${redirectUrlAfterLogin}",  context: "${context}"`);
    }
  }
}
