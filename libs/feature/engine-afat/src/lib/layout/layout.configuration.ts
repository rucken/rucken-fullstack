import { Type } from '@angular/core';
import { Route, UrlTree } from '@angular/router';
import { SsoRoleInterface } from '@rucken/rucken-rest-sdk-angular';

export type LayoutPartNavigation = {
  link?: string;
  href?: string;
  icon?: string;
  title?: string;
  roles?: SsoRoleInterface[];
};

export type LayoutPart = {
  root?: boolean;
  second?: boolean;
  navigation: LayoutPartNavigation;
  route?: Route;
};

export type LayoutConfiguration = {
  title: string;
  parts: LayoutPart[];
};
