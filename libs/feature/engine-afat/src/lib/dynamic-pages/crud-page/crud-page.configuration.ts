/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from '@angular/core';
import { RequestMeta } from '@nestjs-mod/misc';
import { Observable } from 'rxjs';
import { DynamicCrudFormConfiguration } from '../../dynamic-forms/dynamic-crud-form/dynamic-crud-form.configuration';
import { DynamicCrudGridConfiguration } from '../../dynamic-grids/dynamic-crud-grid/dynamic-crud-grid.configuration';
import { CrudComponent } from './crud-page.component';

export type CrudConfiguration = {
  title?: string;
  component?: Type<any>;
  grid: () => DynamicCrudGridConfiguration;
  form: () => DynamicCrudFormConfiguration;
  handlers: () => {
    init?: (page: CrudComponent) => void;
    createOne?: (data: any) => Observable<any>;
    updateOne?: (id: string, data: any) => Observable<any>;
    deleteOne?: (id: string) => Observable<any>;
    findOne?: (id: string) => Observable<any>;
    findMany?: ({ filters, meta }: { filters: Record<string, string>; meta?: RequestMeta }) => Observable<{
      meta: {
        curPage?: number;
        perPage?: number;
        totalResults: number;
      };
      items: any[];
    }>;
  };
};
