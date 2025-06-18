import { FormlyFieldConfig } from '@ngx-formly/core';
import { DynamicCrudFormComponent } from './dynamic-crud-form.component';

export type DynamicCrudFormConfiguration = {
  inputs: FormlyFieldConfig[];
  handlers?: {
    init?: (form: DynamicCrudFormComponent) => void;
  };
};
