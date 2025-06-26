import { AsyncPipe, NgFor, NgForOf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LangDefinition, TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EnginePublicProjectDtoInterface, EngineRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { addHours } from 'date-fns';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

import { Title } from '@angular/platform-browser';
import { FilesService } from '@nestjs-mod/files-afat';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BehaviorSubject, from, map, merge, mergeMap, Observable, of, switchMap, take, tap, toArray } from 'rxjs';

import { TIMEZONE_OFFSET } from '@nestjs-mod/misc';
import { RuckenRestSdkAngularService } from '@rucken/rucken-rest-sdk-angular';
import { RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN, RuckenAfatEngineConfiguration } from '../engine-afat.configuration';
import { ROOT_PATH_MARKER } from '../engine-afat.constants';
import { CheckUserRolesPipe } from '../pipes/check-user-roles.pipe';
import { UserPipe } from '../pipes/user.pipe';
import { EngineActiveLangService } from '../services/auth-active-lang.service';
import { EngineGuardService } from '../services/auth-guard.service';
import { EngineService } from '../services/auth.service';
import { EngineActiveProjectService } from '../services/engine-active-project.service';
import { TokensService } from '../services/tokens.service';
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
  standalone: true,
})
export class LayoutComponent implements OnInit {
  title!: string;
  serverTime$ = new BehaviorSubject<Date>(new Date());
  lang$ = new BehaviorSubject<string>('');
  availableLangs$ = new BehaviorSubject<LangDefinition[]>([]);
  EngineRoleInterface = EngineRoleInterface;

  publicProjects$?: Observable<EnginePublicProjectDtoInterface[] | undefined>;
  activePublicProject$?: Observable<EnginePublicProjectDtoInterface | undefined>;
  navigations$ = new BehaviorSubject<LayoutPartNavigation[]>([]);

  constructor(
    @Inject(RUCKEN_AFAT_ENGINE_CONFIGURATION_TOKEN)
    private readonly ruckenAfatEngineConfiguration: RuckenAfatEngineConfiguration,
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    private readonly engineService: EngineService,
    private readonly router: Router,
    private readonly translocoService: TranslocoService,
    private readonly tokensService: TokensService,
    private readonly engineActiveLangService: EngineActiveLangService,
    private readonly engineActiveProjectService: EngineActiveProjectService,
    private readonly titleService: Title,
    private readonly filesService: FilesService,
    private readonly authGuardService: EngineGuardService,
  ) {
    this.title = this.translocoService.translate(ruckenAfatEngineConfiguration.layout.title);
    this.titleService.setTitle(this.title);
  }

  private setNavigations() {
    return from(this.ruckenAfatEngineConfiguration.layout.parts).pipe(
      mergeMap((part) =>
        this.authGuardService
          .checkUserRoles(part.roles)
          .pipe(map((result) => ((result || !part.roles) && !part.hidden ? part.navigation : null))),
      ),
      take(this.ruckenAfatEngineConfiguration.layout.parts.length),
      toArray(),
      tap((navigations) => this.navigations$.next(navigations.filter(Boolean) as LayoutPartNavigation[])),
    );
  }

  ngOnInit() {
    this.loadAvailablePublicProjects();

    this.loadAvailableLangs();
    this.subscribeToChangeProfile();
    this.subscribeToLangChanges();

    this.fillServerTime().pipe(untilDestroyed(this)).subscribe();

    merge(of(true), this.engineService.profile$)
      .pipe(
        mergeMap(() => this.setNavigations()),
        untilDestroyed(this),
      )
      .subscribe();
  }

  getFullFilePath(value: string) {
    if (typeof value !== 'string') {
      return undefined;
    }
    return (!value.toLowerCase().startsWith('http') ? this.filesService.getMinioURL() : '') + value;
  }

  setActivePublicProject(activePublicProject?: EnginePublicProjectDtoInterface) {
    this.engineActiveProjectService.setActivePublicProject(activePublicProject);
  }

  private loadAvailablePublicProjects() {
    this.publicProjects$ = this.engineActiveProjectService.publicProjects$.asObservable();
    this.activePublicProject$ = this.engineActiveProjectService.activePublicProject$.asObservable();

    this.engineActiveProjectService.loadAvailablePublicProjects();
  }

  private subscribeToChangeProfile() {
    this.engineService.profile$
      .asObservable()
      .pipe(
        mergeMap((profile) => {
          if (!profile) {
            this.engineActiveLangService.clearLocalStorage();
          }
          return this.engineActiveLangService.refreshActiveLang();
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  setActiveLang(lang: string) {
    this.engineActiveLangService.setActiveLang(lang).pipe(untilDestroyed(this)).subscribe();
  }

  signOut() {
    this.engineService
      .signOut()
      .pipe(
        tap(() => this.router.navigate([ROOT_PATH_MARKER])),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private loadAvailableLangs() {
    this.availableLangs$.next(this.translocoService.getAvailableLangs() as LangDefinition[]);
  }

  private subscribeToLangChanges() {
    this.translocoService.langChanges$
      .pipe(
        tap((lang) => {
          this.lang$.next(lang);
          this.engineActiveProjectService.loadAvailablePublicProjects();
        }),
        untilDestroyed(this),
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
              path: token?.access_token ? `/ws/time?token=${token?.access_token}` : '/ws/time',
              eventName: 'ChangeTimeStream',
            }),
          ),
        )
        .pipe(map((result) => result.data)),
    ).pipe(tap((result) => this.serverTime$.next(addHours(new Date(result as string), TIMEZONE_OFFSET))));
  }
}
