import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { SsoForgotPasswordFormComponent } from '../../forms/auth-forgot-password-form/auth-forgot-password-form.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  imports: [NzBreadCrumbModule, TranslocoDirective, SsoForgotPasswordFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ForgotPasswordComponent {}
