import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { searchIn } from '@nestjs-mod/misc';
import { SsoRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { SsoService, SsoSignInFormComponent } from '@rucken/sso-afat';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import {
  ROOT_PATH_MARKER,
  SECOND_PATH_MARKER,
} from '../../engine-afat.constants';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  imports: [NzBreadCrumbModule, TranslocoDirective, SsoSignInFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
  constructor(
    private readonly router: Router,
    private readonly ssoService: SsoService
  ) {}
  onAfterSignIn() {
    if (
      searchIn(SsoRoleInterface.admin, this.ssoService.profile$.value?.roles)
    ) {
      this.router.navigate([SECOND_PATH_MARKER]);
    } else {
      this.router.navigate([ROOT_PATH_MARKER]);
    }
  }
}
