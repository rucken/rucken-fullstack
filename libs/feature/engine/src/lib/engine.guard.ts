import { getRequestFromExecutionContext } from '@nestjs-mod/common';
import { searchIn, splitIn } from '@nestjs-mod/misc';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCEPT_LANGUAGE, TranslatesStorage } from 'nestjs-translates';
import { EngineUser } from './generated/rest/dto/engine-user.entity';
import { EngineCacheService } from './services/engine-cache.service';
import { EngineProjectService } from './services/engine-project.service';
import { EngineTokensService } from './services/engine-tokens.service';
import { EngineConfiguration } from './engine.configuration';
import { X_SKIP_THROTTLE } from './engine.constants';
import {
  AllowEmptyEngineUser,
  CheckHaveEngineClientSecret,
  CheckEngineRole,
  SkipEngineGuard,
  SkipValidateRefreshSession,
} from './engine.decorators';
import { EngineStaticEnvironments } from './engine.environments';
import { EngineError, EngineErrorEnum } from './engine.errors';
import { EngineRequest } from './types/engine-request';
import { EngineRole } from './types/engine-role';

@Injectable()
export class EngineGuard implements CanActivate {
  private readonly logger = new Logger(EngineGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly engineCacheService: EngineCacheService,
    private readonly engineTokensService: EngineTokensService,
    private readonly engineProjectService: EngineProjectService,
    private readonly engineStaticEnvironments: EngineStaticEnvironments,
    private readonly engineConfiguration: EngineConfiguration,
    private readonly translatesStorage: TranslatesStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const {
      allowEmptyUserMetadata,
      skipValidateRefreshSession,
      checkHaveEngineClientSecret,
      checkEngineRole,
      skipEngineGuard,
    } = this.getHandlersReflectMetadata(context);

    const req = this.getRequestFromExecutionContext(context);

    const validate = async () => {
      if (allowEmptyUserMetadata) {
        req.skipEmptyEngineUser = true;
      }

      if (req.headers[X_SKIP_THROTTLE] && req.headers[X_SKIP_THROTTLE] === this.engineStaticEnvironments.adminSecret) {
        req.skipThrottle = true;
      }

      if (skipEngineGuard) {
        return true;
      }

      // detect project
      if (checkHaveEngineClientSecret && !req.engineClientSecret) {
        throw new EngineError(EngineErrorEnum.Forbidden);
      }
      req.engineProject = await this.engineProjectService.getProjectByRequest(req);

      // process jwt token
      req.engineAccessTokenData = await this.engineTokensService.verifyAndDecodeAccessToken(
        req.headers['authorization']?.split(' ')?.[1],
      );
      if (!skipValidateRefreshSession && req.engineAccessTokenData?.refreshToken) {
        const refreshSession = await this.engineCacheService.getCachedRefreshSession(
          req.engineAccessTokenData?.refreshToken,
        );
        if (!refreshSession?.enabled) {
          throw new EngineError(EngineErrorEnum.YourSessionHasBeenBlocked);
        }
        this.engineTokensService.verifyRefreshSession({
          oldRefreshSession: refreshSession,
        });
      }

      // get user
      req.engineUser = req.engineAccessTokenData?.userId
        ? await this.engineCacheService.getCachedUser({
            userId: req.engineAccessTokenData?.userId,
          })
        : undefined;

      // check user as revoke
      if (req.engineUser?.id && req.engineUser.revokedAt) {
        const nowTime = new Date();
        if (+nowTime > +new Date(req.engineUser.revokedAt)) {
          this.logger.debug({
            checkRevokedAtOfUser: {
              revokedAt: req.engineUser.revokedAt,
              nowTime,
            },
          });
          throw new EngineError(EngineErrorEnum.YourSessionHasBeenBlocked);
        }
      }

      // set admin roles
      if (
        this.engineConfiguration.adminSecretHeaderName &&
        req.headers?.[this.engineConfiguration.adminSecretHeaderName]
      ) {
        if (
          req.headers?.[this.engineConfiguration.adminSecretHeaderName] !== this.engineStaticEnvironments.adminSecret
        ) {
          throw new EngineError(EngineErrorEnum.Forbidden);
        }
        if (!req.engineUser) {
          req.engineUser = {} as EngineUser;
        }
        req.engineUser.roles = EngineRole.admin;
      }
      if (
        req.engineUser &&
        this.engineStaticEnvironments.adminEmail &&
        req.engineUser?.email === this.engineStaticEnvironments.adminEmail
      ) {
        req.engineUser.roles = EngineRole.admin;
      }
      if (
        req.engineUser &&
        this.engineStaticEnvironments.adminDefaultRoles &&
        searchIn(this.engineStaticEnvironments.adminDefaultRoles, req.engineUser.roles)
      ) {
        req.engineUser.roles = [...new Set([...splitIn(req.engineUser.roles), EngineRole.admin])].join(',');
      }

      // set manager roles
      if (
        req.engineUser &&
        this.engineStaticEnvironments.adminDefaultRoles &&
        searchIn(this.engineStaticEnvironments.managerDefaultRoles, req.engineUser.roles)
      ) {
        req.engineUser.roles = [...new Set([...splitIn(req.engineUser.roles), EngineRole.manager])].join(',');
      }

      // check roles by handler roles
      if (checkEngineRole && req.engineUser?.id && !searchIn(req.engineUser.roles, checkEngineRole)) {
        throw new EngineError(EngineErrorEnum.Forbidden);
      }

      // current lang
      if (req.engineUser?.lang) {
        req.headers[ACCEPT_LANGUAGE] = req.engineUser.lang;
      }

      if (
        !req.headers[ACCEPT_LANGUAGE] ||
        (req.headers[ACCEPT_LANGUAGE] && !this.translatesStorage.locales.includes(req.headers[ACCEPT_LANGUAGE]))
      ) {
        req.headers[ACCEPT_LANGUAGE] = this.translatesStorage.defaultLocale;
      }

      // check access by custom logic
      if (this.engineConfiguration.checkAccessValidator) {
        await this.engineConfiguration.checkAccessValidator(req.engineUser, context);
      }

      // throw error if user is empty
      if (!req.engineUser && !req.skipEmptyEngineUser) {
        throw new EngineError(EngineErrorEnum.Forbidden);
      }

      return true;
    };

    try {
      this.log({ context, req, skipEngineGuard, checkEngineRole });

      const result = await validate();

      this.log({ context, result, req, skipEngineGuard, checkEngineRole });

      if (!result) {
        throw new EngineError(EngineErrorEnum.Forbidden);
      }

      return result;
    } catch (err) {
      this.log({
        context,
        error: err,
        req,
        skipEngineGuard,
        checkEngineRole,
      });
      throw err;
    }
  }

  private log({
    context,
    result,
    error,
    req,
    skipEngineGuard,
    checkEngineRole,
  }: {
    context: ExecutionContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any;
    req: EngineRequest;
    skipEngineGuard: boolean;
    checkEngineRole: EngineRole[] | undefined;
  }) {
    const message = `${context.getClass().name}.${context.getHandler().name}${
      error ? `: ${String(error)}` : result ? `: ${result}` : ''
    }, projectId: ${JSON.stringify(req.engineProject?.id)}, clientId: ${JSON.stringify(
      req.engineClientId,
    )}, accessTokenData: ${JSON.stringify(
      req.engineAccessTokenData,
    )}, userId: ${JSON.stringify(req.engineUser?.id)}, userRoles: ${JSON.stringify(
      req.engineUser?.roles,
    )}, skipGuard: ${JSON.stringify(skipEngineGuard)}, checkRole: ${JSON.stringify(
      checkEngineRole,
    )}, language: ${JSON.stringify(req.headers[ACCEPT_LANGUAGE])}`;
    if (error) {
      this.logger.error(message);
    } else {
      this.logger.debug(message);
    }
  }

  private getRequestFromExecutionContext(context: ExecutionContext) {
    const req = getRequestFromExecutionContext(context) as EngineRequest;
    req.headers = req.headers || {};
    return req;
  }

  private getHandlersReflectMetadata(context: ExecutionContext) {
    const skipValidateRefreshSession = Boolean(
      (typeof context.getHandler === 'function' &&
        this.reflector.get(SkipValidateRefreshSession, context.getHandler()) === true) ||
        (typeof context.getClass === 'function' &&
          this.reflector.get(SkipValidateRefreshSession, context.getClass()) === true) ||
        undefined,
    );

    const allowEmptyUserMetadata = Boolean(
      (typeof context.getHandler === 'function' && this.reflector.get(AllowEmptyEngineUser, context.getHandler())) ||
        (typeof context.getClass === 'function' && this.reflector.get(AllowEmptyEngineUser, context.getClass())) ||
        undefined,
    );

    const checkHaveEngineClientSecret = Boolean(
      (typeof context.getHandler === 'function' &&
        this.reflector.get(CheckHaveEngineClientSecret, context.getHandler())) ||
        (typeof context.getClass === 'function' &&
          this.reflector.get(CheckHaveEngineClientSecret, context.getClass())) ||
        undefined,
    );

    const skipEngineGuard = Boolean(
      (typeof context.getHandler === 'function' && this.reflector.get(SkipEngineGuard, context.getHandler())) ||
        (typeof context.getClass === 'function' && this.reflector.get(SkipEngineGuard, context.getClass())) ||
        undefined,
    );

    const checkEngineRole =
      (typeof context.getHandler === 'function' && this.reflector.get(CheckEngineRole, context.getHandler())) ||
      (typeof context.getClass === 'function' && this.reflector.get(CheckEngineRole, context.getClass())) ||
      undefined;

    return {
      allowEmptyUserMetadata,
      checkHaveEngineClientSecret,
      skipValidateRefreshSession,
      skipEngineGuard,
      checkEngineRole,
    };
  }
}
