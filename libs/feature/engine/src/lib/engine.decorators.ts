import { getRequestFromExecutionContext, prepareHeaders } from '@nestjs-mod/common';
import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EngineTimezoneInterceptor } from './interceptors/engine-timezone.interceptor';
import { EngineGuard } from './engine.guard';
import { EngineRequest } from './types/engine-request';
import { EngineRole } from './types/engine-role';

export const SkipValidateRefreshSession = Reflector.createDecorator();
export const AllowEmptyEngineUser = Reflector.createDecorator();
export const CheckHaveEngineClientSecret = Reflector.createDecorator<true>();
export const SkipEngineGuard = Reflector.createDecorator<true>();
export const CheckEngineRole = Reflector.createDecorator<EngineRole[]>();

export const CurrentEngineRequest = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = getRequestFromExecutionContext(ctx) as EngineRequest;
  return req;
});

export const CurrentEngineUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = getRequestFromExecutionContext(ctx) as EngineRequest;
  return req.engineUser;
});

function AddHandleConnection() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (constructor: Function) {
    if (constructor.prototype) {
      constructor.prototype.handleConnection = function (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args: any[]
      ) {
        const url = args[0]?.url ? new URL(`http://localhost${args[0]?.url}`) : null;

        const queryToken = url?.searchParams.get('token');
        const queryClientId = url?.searchParams.get('clientId');

        const headers = prepareHeaders(args[0]?.headers);

        const authorizationHeader = headers.authorization;
        const xClientIdHeader = headers['x-client-id'];

        client.headers = {
          ...(authorizationHeader || queryToken
            ? {
                authorization: authorizationHeader ? authorizationHeader : queryToken ? `Bearer ${queryToken}` : '',
              }
            : {}),
          ...(xClientIdHeader
            ? {
                'x-client-id': xClientIdHeader || queryClientId,
              }
            : {}),
        };
      };
    }
  };
}

export function UseEngineInterceptorsAndGuards(options?: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  guards?: (CanActivate | Function)[];
  skipInterceptor?: boolean;
}) {
  return applyDecorators(
    ...[
      ...(options?.skipInterceptor ? [] : [UseInterceptors(EngineTimezoneInterceptor)]),
      UseGuards(...(options?.guards || []), EngineGuard),
      AllowEmptyEngineUser(),
      AddHandleConnection(),
    ],
  );
}
