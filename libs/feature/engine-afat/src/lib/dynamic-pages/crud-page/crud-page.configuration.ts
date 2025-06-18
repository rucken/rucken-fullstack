import { Type } from '@angular/core';
import { RequestMeta } from '@nestjs-mod/misc';
import { Observable } from 'rxjs';
import { DynamicCrudFormConfiguration } from '../../dynamic-forms/dynamic-crud-form/dynamic-crud-form.configuration';
import { DynamicCrudGridConfiguration } from '../../dynamic-grids/dynamic-crud-grid/dynamic-crud-grid.configuration';
import { CrudComponent } from './crud-page.component';

export type CrudConfiguration = {
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: Type<any>;
  grid: () => DynamicCrudGridConfiguration;
  form: () => DynamicCrudFormConfiguration;
  handlers: () => {
    init?: (page: CrudComponent) => void;
    createOne?: (data: unknown) => Observable<unknown>;
    updateOne?: (id: string, data: unknown) => Observable<unknown>;
    deleteOne?: (id: string) => Observable<unknown>;
    findOne?: (id: string) => Observable<unknown>;
    findMany?: ({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) => Observable<{
      meta: {
        curPage?: number;
        perPage?: number;
        totalResults: number;
      };
      items: unknown[];
    }>;
  };
};
