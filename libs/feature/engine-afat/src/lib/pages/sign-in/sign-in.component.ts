import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { searchIn } from '@nestjs-mod/misc';
import { EngineRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { ROOT_PATH_MARKER, SECOND_PATH_MARKER } from '../../engine-afat.constants';
import { EngineService } from '../../services/auth.service';
import { EngineSignInFormComponent } from '../../forms/auth-sign-in-form/auth-sign-in-form.component';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  imports: [NzBreadCrumbModule, TranslocoDirective, EngineSignInFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SignInComponent {
  constructor(
    private readonly router: Router,
    private readonly engineService: EngineService,
  ) {}
  onAfterSignIn() {
    if (searchIn(EngineRoleInterface.admin, this.engineService.profile$.value?.roles)) {
      this.router.navigate([SECOND_PATH_MARKER]);
    } else {
      this.router.navigate([ROOT_PATH_MARKER]);
    }
  }
}
