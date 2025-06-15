import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { Observable } from 'rxjs';
import { DynamicCrudGridComponent } from '../../dynamic-grids/dynamic-crud-grid/dynamic-crud-grid.component';
import { CrudConfiguration } from './crud.configuration';

@Component({
  selector: 'crud',
  templateUrl: './crud.component.html',
  imports: [
    NzBreadCrumbModule,
    NzGridModule,
    NzLayoutModule,
    TranslocoDirective,
    AsyncPipe,
    DynamicCrudGridComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrudComponent {
  crudConfiguration$ = this.activatedRoute
    .data as Observable<CrudConfiguration>;

  constructor(private readonly activatedRoute: ActivatedRoute) {}
}
