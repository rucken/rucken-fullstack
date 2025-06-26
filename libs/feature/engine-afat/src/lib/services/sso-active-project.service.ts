import { Injectable } from '@angular/core';
import { RequestMeta } from '@nestjs-mod/misc';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RuckenRestSdkAngularService, SsoPublicProjectDtoInterface } from '@rucken/rucken-rest-sdk-angular';
import { BehaviorSubject, map, tap } from 'rxjs';

export const SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY = 'activeUserClientId';
export const X_CLIENT_ID_HEADER_NAME = 'x-client-id';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class SsoActiveProjectService {
  publicProjects$ = new BehaviorSubject<SsoPublicProjectDtoInterface[] | undefined>(undefined);

  activePublicProject$ = new BehaviorSubject<SsoPublicProjectDtoInterface | undefined>(undefined);

  getAuthorizationHeaders(): Record<string, string> {
    const clientId = localStorage.getItem(SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY);
    if (clientId) {
      return {
        [X_CLIENT_ID_HEADER_NAME as string]: clientId,
      };
    }
    return {};
  }

  constructor(private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService) {}

  setActivePublicProject(activePublicProject?: SsoPublicProjectDtoInterface) {
    if (activePublicProject?.clientId) {
      localStorage.setItem(SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY, activePublicProject.clientId);
    } else {
      localStorage.removeItem(SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY);
    }
    this.activePublicProject$.next(activePublicProject);
  }

  loadAvailablePublicProjects() {
    this.findManyPublic({ filters: {} })
      .pipe(
        tap((projects) => {
          this.publicProjects$.next(projects.items.length > 1 ? projects.items : undefined);
          this.setActivePublicProject(
            projects.items.find((p) => p.clientId === localStorage.getItem(SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY)) ||
              projects.items[0],
          );
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  findManyPublic({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) {
    return this.ruckenRestSdkAngularService
      .getSsoApi()
      .ssoPublicProjectsControllerFindMany(
        meta?.curPage,
        meta?.perPage,
        filters['search'],
        meta?.sort
          ? Object.entries(meta?.sort)
              .map(([key, value]) => `${key}:${value}`)
              .join(',')
          : undefined,
      )
      .pipe(
        map(({ meta, ssoPublicProjects }) => ({
          meta,
          items: ssoPublicProjects,
        })),
      );
  }
}
