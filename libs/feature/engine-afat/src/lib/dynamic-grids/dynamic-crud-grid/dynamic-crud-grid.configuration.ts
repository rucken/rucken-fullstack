export type DynamicCrudGridColumn = {
  name: string;
  title: string;
  isDate?: boolean;
};

export type DynamicCrudGridConfiguration = {
  title?: string;
  columns: DynamicCrudGridColumn[];
  modals: {
    create?: { title: string; width?: string };
    update?: { title: string; width?: string };
    delete?: { title: string; width?: string };
  };
};
