import { DynamicCrudGridComponent } from './dynamic-crud-grid.component';

export type DynamicCrudGridColumn = {
  name: string;
  title: string;
  isDate?: boolean;
  isFile?: boolean;
};

export type DynamicCrudGridConfiguration = {
  title?: string;
  columns: DynamicCrudGridColumn[];
  loadManyAfterInit?: boolean;
  handlers?: {
    init?: (grid: DynamicCrudGridComponent) => void;
    selectOne?: (grid: DynamicCrudGridComponent, id: string, data?: unknown) => void;
  };
  actions: {
    create?: {
      buttonTitle?: string;
      title: string;
      width?: string;
      showModal?: (grid: DynamicCrudGridComponent) => void;
    };
    update?: {
      buttonTitle?: string;
      title: string;
      width?: string;
      showModal?: (grid: DynamicCrudGridComponent, id: string) => void;
    };
    delete?: {
      buttonTitle?: string;
      title: string;
      width?: string;
      showModal?: (grid: DynamicCrudGridComponent, id: string) => void;
    };
  };
};
