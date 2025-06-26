import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { searchIn } from '@nestjs-mod/misc';
import { SsoRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { ROOT_PATH_MARKER, SECOND_PATH_MARKER } from '../../engine-afat.constants';
import { SsoCompleteForgotPasswordFormComponent } from '../../forms/auth-complete-forgot-password-form/auth-complete-forgot-password-form.component';
import { SsoService } from '../../services/auth.service';
import { SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY } from '../../services/sso-active-project.service';

@Component({
  selector: 'app-complete-invite',
  templateUrl: './complete-invite.component.html',
  imports: [NzBreadCrumbModule, TranslocoDirective, SsoCompleteForgotPasswordFormComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class CompleteInviteComponent {
  code?: string | null;
  redirectUri?: string | null;

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly ssoService: SsoService,
  ) {
    this.code = this.activatedRoute.snapshot.queryParamMap.get('code');
    this.redirectUri = this.activatedRoute.snapshot.queryParamMap.get('redirect_uri');

    const clientId = this.activatedRoute.snapshot.queryParamMap.get('client_id');
    if (clientId && clientId !== undefined) {
      localStorage.setItem(SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY, clientId);
      this.ssoService.updateHeaders();
    }
  }

  onAfterCompleteForgotPassword() {
    if (!this.redirectUri) {
      if (searchIn(SsoRoleInterface.admin, this.ssoService.profile$.value?.roles)) {
        this.router.navigate([SECOND_PATH_MARKER]);
      } else {
        this.router.navigate([ROOT_PATH_MARKER]);
      }
    } else {
      location.href = this.redirectUri;
    }
  }
}
