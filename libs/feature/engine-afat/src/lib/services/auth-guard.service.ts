import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, concatMap, first, from, map, of } from 'rxjs';
import { EngineService } from './auth.service';

export const ENGINE_GUARD_DATA_ROUTE_KEY = 'engineGuardData';

export type OnActivateOptions = {
  activatedRouteSnapshot: ActivatedRouteSnapshot;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  engineService: EngineService;
  router: Router;
};

export class EngineGuardData {
  roles?: string[];

  afterActivate?: (options: OnActivateOptions) => Promise<boolean>;

  constructor(options?: EngineGuardData) {
    Object.assign(this, options);
  }
}

@Injectable({ providedIn: 'root' })
export class EngineGuardService implements CanActivate {
  constructor(
    private readonly engineService: EngineService,
    private readonly nzMessageService: NzMessageService,
    private readonly translocoService: TranslocoService,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const engineGuardData =
      route.data && route.data[ENGINE_GUARD_DATA_ROUTE_KEY] instanceof EngineGuardData
        ? route.data[ENGINE_GUARD_DATA_ROUTE_KEY]
        : null;
    if (engineGuardData) {
      return this.checkUserRoles(engineGuardData?.roles).pipe(
        first(),
        concatMap(async (result) => {
          if (!result) {
            throw new Error('Forbidden');
          }
          return result;
        }),
        concatMap(async () => {
          if (engineGuardData.afterActivate) {
            await engineGuardData.afterActivate({
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
          if (engineGuardData.afterActivate) {
            return from(
              engineGuardData.afterActivate({
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
    return of(true);
  }

  checkUserRoles(engineRoles?: string[]) {
    return this.engineService.profile$.pipe(
      map((engineUser) => {
        const engineGuardDataRoles = (engineRoles || []).map((role) => role.toLowerCase());
        const result = Boolean(
          (engineUser &&
            engineGuardDataRoles.length > 0 &&
            engineGuardDataRoles.some((r) => engineUser.roles?.map((r) => r.toLowerCase()).includes(r))) ||
            (engineGuardDataRoles.length === 0 && !engineUser?.roles),
        );
        if (!result) {
          console.log(result, { engineUser: engineUser, engineGuardDataRoles }, [
            [
              engineUser,
              engineGuardDataRoles.length > 0,
              engineUser &&
                engineGuardDataRoles
                  .map((role) => role.toLowerCase())
                  .some((r) => engineUser.roles?.map((r) => r.toLowerCase()).includes(r)),
            ],
            [engineGuardDataRoles.length === 0, !engineUser?.roles],
          ]);
        }
        return result;
      }),
    );
  }
}
