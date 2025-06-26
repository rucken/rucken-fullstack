import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, concatMap, from, map, mergeMap, of } from 'rxjs';
import { EngineService } from './auth.service';

export const ENGINE_COMPLETE_GUARD_DATA_ROUTE_KEY = 'engineGuardCompleteData';

export type CompleteSignUpOptions = {
  activatedRouteSnapshot: ActivatedRouteSnapshot;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  engineService: EngineService;
  router: Router;
};

export class EngineCompleteGuardData {
  type?: 'complete-sign-up' | 'complete-forgot-password' | 'complete-invite' | 'complete-oauth-sign-up';

  beforeCompleteSignUp?: (options: CompleteSignUpOptions) => Promise<boolean>;

  afterCompleteSignUp?: (options: CompleteSignUpOptions) => Promise<boolean>;

  constructor(options?: EngineCompleteGuardData) {
    Object.assign(this, options);
  }
}

@Injectable({ providedIn: 'root' })
export class EngineCompleteGuardService implements CanActivate {
  constructor(
    private readonly nzMessageService: NzMessageService,
    private readonly translocoService: TranslocoService,
    private readonly engineService: EngineService,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const engineCompleteGuardData =
      route.data && route.data[ENGINE_COMPLETE_GUARD_DATA_ROUTE_KEY] instanceof EngineCompleteGuardData
        ? route.data[ENGINE_COMPLETE_GUARD_DATA_ROUTE_KEY]
        : null;
    if (engineCompleteGuardData) {
      if (engineCompleteGuardData.type === 'complete-oauth-sign-up') {
        const verificationCode = route.queryParamMap.get('verification_code');
        const clientId = route.queryParamMap.get('client_id');
        if (verificationCode) {
          return (
            engineCompleteGuardData.beforeCompleteSignUp
              ? from(
                  engineCompleteGuardData.beforeCompleteSignUp({
                    activatedRouteSnapshot: route,
                    engineService: this.engineService,
                    router: this.router,
                  }),
                )
              : of(true)
          ).pipe(
            mergeMap(() =>
              this.engineService.oAuthVerification({
                verificationCode,
                clientId: clientId || undefined,
              }),
            ),
            map(async () => {
              this.nzMessageService.success(
                this.translocoService.translate('Successful login using external single sign-on system'),
              );
              return true;
            }),
            mergeMap(() => this.engineService.refreshToken()),
            concatMap(async () => {
              if (engineCompleteGuardData.afterCompleteSignUp) {
                await engineCompleteGuardData.afterCompleteSignUp({
                  activatedRouteSnapshot: route,
                  engineService: this.engineService,
                  router: this.router,
                });
              }
              return true;
            }),
            catchError((err) => {
              console.error(err);
              this.nzMessageService.error(this.translocoService.translate(err.error?.message || err.message));
              if (engineCompleteGuardData.afterCompleteSignUp) {
                return from(
                  engineCompleteGuardData.afterCompleteSignUp({
                    activatedRouteSnapshot: route,
                    engineService: this.engineService,
                    router: this.router,
                    error: err,
                  }),
                );
              }
              return of(false);
            }),
          );
        }
      }
      if (engineCompleteGuardData.type === 'complete-sign-up') {
        const code = route.queryParamMap.get('code');
        if (code) {
          return (
            engineCompleteGuardData.beforeCompleteSignUp
              ? from(
                  engineCompleteGuardData.beforeCompleteSignUp({
                    activatedRouteSnapshot: route,
                    engineService: this.engineService,
                    router: this.router,
                  }),
                )
              : of(true)
          ).pipe(
            mergeMap(() =>
              this.engineService.completeSignUp({
                code,
              }),
            ),
            map(async () => {
              this.nzMessageService.success(this.translocoService.translate('Email address successfully verified'));
              return true;
            }),
            mergeMap(() => this.engineService.refreshToken()),
            concatMap(async () => {
              if (engineCompleteGuardData.afterCompleteSignUp) {
                await engineCompleteGuardData.afterCompleteSignUp({
                  activatedRouteSnapshot: route,
                  engineService: this.engineService,
                  router: this.router,
                });
              }
              return true;
            }),
            catchError((err) => {
              console.error(err);
              this.nzMessageService.error(this.translocoService.translate(err.error?.message || err.message));
              if (engineCompleteGuardData.afterCompleteSignUp) {
                return from(
                  engineCompleteGuardData.afterCompleteSignUp({
                    activatedRouteSnapshot: route,
                    engineService: this.engineService,
                    router: this.router,
                    error: err,
                  }),
                );
              }
              return of(false);
            }),
          );
        }
      }
    }
    return of(true);
  }
}
