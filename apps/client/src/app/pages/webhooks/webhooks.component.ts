import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ActiveProjectPipe } from '@rucken/engine-afat';
import { WebhookGridComponent, WebhookLogGridComponent } from '@nestjs-mod/webhook-afat';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

@Component({
  selector: 'app-webhooks',
  templateUrl: './webhooks.component.html',
  imports: [
    NzBreadCrumbModule,
    WebhookGridComponent,
    WebhookLogGridComponent,
    NzGridModule,
    NzLayoutModule,
    AsyncPipe,
    NgIf,
    TranslocoDirective,
    ActiveProjectPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class WebhooksComponent {}
