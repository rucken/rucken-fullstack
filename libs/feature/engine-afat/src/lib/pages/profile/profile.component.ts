import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { EngineProfileFormComponent } from '../../forms/auth-profile-form/auth-profile-form.component';

@UntilDestroy()
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [NzBreadCrumbModule, EngineProfileFormComponent, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ProfileComponent {}
