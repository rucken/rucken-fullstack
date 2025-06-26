import { Route } from '@angular/router';
import { EngineRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { CrudConfiguration } from '../dynamic-pages/crud-page/crud-page.configuration';

export type LayoutPartNavigation =
  | {
      link: string;
      icon?: string;
      title?: string;
    }
  | {
      href: string;
      icon?: string;
      title?: string;
    };

export type LayoutPart = {
  roles?: EngineRoleInterface[];
  root?: boolean;
  second?: boolean;
  navigation: LayoutPartNavigation;
  route?: Route;
  crud?: CrudConfiguration;
  relatedCrud?: CrudConfiguration;
  hidden?: boolean;
};

export type LayoutConfiguration = {
  title: string;
  parts: LayoutPart[];
};
