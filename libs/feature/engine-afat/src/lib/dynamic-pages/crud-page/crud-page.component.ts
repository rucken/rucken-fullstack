import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { map, tap } from 'rxjs';
import { DynamicCrudGridComponent } from '../../dynamic-grids/dynamic-crud-grid/dynamic-crud-grid.component';
import {
  ENGINE_AFAT_GUARD_CRUD_DATA_ROUTE_KEY,
  ENGINE_AFAT_GUARD_RELATED_CRUD_DATA_ROUTE_KEY,
} from '../../engine-afat.constants';
import { CrudConfiguration } from './crud-page.configuration';

@Component({
  selector: 'crud-page',
  templateUrl: './crud-page.component.html',
  imports: [NzBreadCrumbModule, NzGridModule, NzLayoutModule, TranslocoDirective, AsyncPipe, DynamicCrudGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class CrudComponent {
  crudConfiguration$ = this.activatedRoute.data.pipe(
    map((data) => data[ENGINE_AFAT_GUARD_CRUD_DATA_ROUTE_KEY] as CrudConfiguration),
  );
  relatedCrudConfiguration$ = this.activatedRoute.data.pipe(
    map((data) => data[ENGINE_AFAT_GUARD_RELATED_CRUD_DATA_ROUTE_KEY] as CrudConfiguration),
    tap(console.log),
  );

  constructor(private readonly activatedRoute: ActivatedRoute) {}
}
