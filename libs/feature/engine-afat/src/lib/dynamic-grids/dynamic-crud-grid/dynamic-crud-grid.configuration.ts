import { InjectionToken } from '@angular/core';

export type DynamicCrudGridColumn = {
  name: string;
  title: string;
  isDate?: boolean;
};

export type DynamicCrudGridConfiguration = {
  columns: DynamicCrudGridColumn[];
  modals: {
    create: { title: string };
    update: { title: string };
    delete: { title: string };
  };
};

export const DYNAMIC_CRUD_GRID_CONFIGURATION_TOKEN =
  new InjectionToken<DynamicCrudGridConfiguration>(
    'DYNAMIC_CRUD_GRID_CONFIGURATION_TOKEN'
  );
