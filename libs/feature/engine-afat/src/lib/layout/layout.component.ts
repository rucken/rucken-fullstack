import { AsyncPipe, NgFor, NgForOf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  LangDefinition,
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SsoRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { addHours } from 'date-fns';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

import { Title } from '@angular/platform-browser';
import { FilesService } from '@nestjs-mod/files-afat';
import {
  CheckUserRolesPipe,
  SsoActiveLangService,
  SsoActiveProjectService,
  SsoGuardService,
  SsoProjectModel,
  SsoService,
  TokensService,
  UserPipe,
} from '@rucken/sso-afat';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import {
  BehaviorSubject,
  from,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  switchMap,
  take,
  tap,
  toArray,
} from 'rxjs';

import { TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import { RuckenRestSdkAngularService } from '@rucken/rucken-rest-sdk-angular';
import {
  RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN,
  RuckenAfatEngineConfiguration,
} from '../engine-afat.configuration';
import { ROOT_PATH_MARKER } from '../engine-afat.constants';
import { LayoutPartNavigation } from './layout.configuration';

@UntilDestroy()
@Component({
  imports: [
    NzIconModule,
    RouterModule,
    NzMenuModule,
    NzLayoutModule,
    NzTypographyModule,
    AsyncPipe,
    NgForOf,
    NgFor,
    TranslocoPipe,
    TranslocoDirective,
    TranslocoDatePipe,
    CheckUserRolesPipe,
    UserPipe,
    NzAvatarModule,
  ],
  selector: 'layout',
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
  title!: string;
  serverTime$ = new BehaviorSubject<Date>(new Date());
  lang$ = new BehaviorSubject<string>('');
  availableLangs$ = new BehaviorSubject<LangDefinition[]>([]);
  SsoRoleInterface = SsoRoleInterface;

  publicProjects$?: Observable<SsoProjectModel[] | undefined>;
  activePublicProject$?: Observable<SsoProjectModel | undefined>;
  navigations$ = new BehaviorSubject<LayoutPartNavigation[]>([]);

  constructor(
    @Inject(RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN)
    private readonly ruckenAfatEngineConfiguration: RuckenAfatEngineConfiguration,
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    private readonly ssoService: SsoService,
    private readonly router: Router,
    private readonly translocoService: TranslocoService,
    private readonly tokensService: TokensService,
    private readonly ssoActiveLangService: SsoActiveLangService,
    private readonly ssoActiveProjectService: SsoActiveProjectService,
    private readonly titleService: Title,
    private readonly filesService: FilesService,
    private readonly authGuardService: SsoGuardService
  ) {
    this.title = this.translocoService.translate(
      ruckenAfatEngineConfiguration.layout.title
    );
    this.titleService.setTitle(this.title);
  }

  private setNavigations() {
    return from(this.ruckenAfatEngineConfiguration.layout.parts).pipe(
      mergeMap((part) =>
        this.authGuardService
          .checkUserRoles(part.roles)
          .pipe(
            map((result) => (result || !part.roles ? part.navigation : null))
          )
      ),
      take(this.ruckenAfatEngineConfiguration.layout.parts.length),
      toArray(),
      tap((navigations) =>
        this.navigations$.next(
          navigations.filter(Boolean) as LayoutPartNavigation[]
        )
      )
    );
  }

  ngOnInit() {
    this.loadAvailablePublicProjects();

    this.loadAvailableLangs();
    this.subscribeToChangeProfile();
    this.subscribeToLangChanges();

    this.fillServerTime().pipe(untilDestroyed(this)).subscribe();

    merge(of(true), this.ssoService.profile$)
      .pipe(
        mergeMap(() => this.setNavigations()),
        untilDestroyed(this)
      )
      .subscribe();
  }

  getFullFilePath(value: string) {
    return (
      (!value.toLowerCase().startsWith('http')
        ? this.filesService.getMinioURL()
        : '') + value
    );
  }

  setActivePublicProject(activePublicProject?: SsoProjectModel) {
    this.ssoActiveProjectService.setActivePublicProject(activePublicProject);
  }

  private loadAvailablePublicProjects() {
    this.publicProjects$ =
      this.ssoActiveProjectService.publicProjects$.asObservable();
    this.activePublicProject$ =
      this.ssoActiveProjectService.activePublicProject$.asObservable();

    this.ssoActiveProjectService.loadAvailablePublicProjects();
  }

  private subscribeToChangeProfile() {
    this.ssoService.profile$
      .asObservable()
      .pipe(
        mergeMap((profile) => {
          if (!profile) {
            this.ssoActiveLangService.clearLocalStorage();
          }
          return this.ssoActiveLangService.refreshActiveLang();
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  setActiveLang(lang: string) {
    this.ssoActiveLangService
      .setActiveLang(lang)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  signOut() {
    this.ssoService
      .signOut()
      .pipe(
        tap(() => this.router.navigate([ROOT_PATH_MARKER])),
        untilDestroyed(this)
      )
      .subscribe();
  }

  private loadAvailableLangs() {
    this.availableLangs$.next(
      this.translocoService.getAvailableLangs() as LangDefinition[]
    );
  }

  private subscribeToLangChanges() {
    this.translocoService.langChanges$
      .pipe(
        tap((lang) => {
          this.lang$.next(lang);
          this.ssoActiveProjectService.loadAvailablePublicProjects();
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  private fillServerTime() {
    return merge(
      this.ruckenRestSdkAngularService.getTimeApi().timeControllerTime(),
      this.tokensService
        .getStream()
        .pipe(
          switchMap((token) =>
            this.ruckenRestSdkAngularService.webSocket<string>({
              path: token?.access_token
                ? `/ws/time?token=${token?.access_token}`
                : '/ws/time',
              eventName: 'ChangeTimeStream',
            })
          )
        )
        .pipe(map((result) => result.data))
    ).pipe(
      tap((result) =>
        this.serverTime$.next(
          addHours(new Date(result as string), TIMEZONE_OFFSET)
        )
      )
    );
  }
}
