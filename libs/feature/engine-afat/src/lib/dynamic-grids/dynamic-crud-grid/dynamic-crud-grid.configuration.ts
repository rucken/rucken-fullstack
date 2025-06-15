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
