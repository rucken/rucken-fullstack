import { Type } from '@angular/core';
import { Route, UrlTree } from '@angular/router';
import { SsoRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { CrudConfiguration } from '../dynamic-pages/crud/crud.configuration';

export type LayoutPartNavigation = {
  link?: string;
  href?: string;
  icon?: string;
  title?: string;
};

export type LayoutPart = {
  roles?: SsoRoleInterface[];
  root?: boolean;
  second?: boolean;
  navigation: LayoutPartNavigation;
  route?: Route;
  crud?: CrudConfiguration;
};

export type LayoutConfiguration = {
  title: string;
  parts: LayoutPart[];
};
