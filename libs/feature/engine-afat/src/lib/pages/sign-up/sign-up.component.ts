import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { searchIn } from '@nestjs-mod/misc';
import { EngineRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { ROOT_PATH_MARKER, SECOND_PATH_MARKER } from '../../engine-afat.constants';
import { EngineSignUpFormComponent } from '../../forms/auth-sign-up-form/auth-sign-up-form.component';
import { EngineService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  imports: [NzBreadCrumbModule, TranslocoDirective, EngineSignUpFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SignUpComponent {
  constructor(
    private readonly router: Router,
    private readonly engineService: EngineService,
  ) {}
  onAfterSignUp() {
    if (searchIn(EngineRoleInterface.admin, this.engineService.profile$.value?.roles)) {
      this.router.navigate([SECOND_PATH_MARKER]);
    } else {
      this.router.navigate([ROOT_PATH_MARKER]);
    }
  }
}
