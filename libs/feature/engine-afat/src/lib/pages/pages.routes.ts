import { Route } from '@angular/router';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { searchIn } from '@nestjs-mod/misc';
import { SsoRoleInterface } from '@rucken/rucken-rest-sdk-angular';
import { CompleteForgotPasswordComponent } from './complete-forgot-password/complete-forgot-password.component';
import { CompleteInviteComponent } from './complete-invite/complete-invite.component';
import { CompleteSignUpComponent } from './complete-sign-up/complete-sign-up.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ProfileComponent } from './profile/profile.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ROOT_PATH_MARKER, SECOND_PATH_MARKER } from '../engine-afat.constants';
import {
  SsoCompleteGuardService,
  SSO_COMPLETE_GUARD_DATA_ROUTE_KEY,
  SsoCompleteGuardData,
  CompleteSignUpOptions,
} from '../services/auth-complete-guard.service';
import {
  SsoGuardService,
  SSO_GUARD_DATA_ROUTE_KEY,
  SsoGuardData,
  OnActivateOptions,
} from '../services/auth-guard.service';
import { SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY } from '../services/sso-active-project.service';

export const ssoPagesRoutes: Route[] = [
  {
    path: 'profile',
    component: ProfileComponent,
    title: marker('Profile'),
    canActivate: [SsoGuardService],
    data: {
      [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
        roles: [SsoRoleInterface.admin, SsoRoleInterface.manager, SsoRoleInterface.user],
        afterActivate: async (options: OnActivateOptions) => {
          if (options.error) {
            options.router.navigate([ROOT_PATH_MARKER]);
            return false;
          }
          return true;
        },
      }),
    },
  },
  {
    path: 'sign-in',
    component: SignInComponent,
    title: marker('Sign-in'),
    canActivate: [SsoGuardService],
    data: {
      [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
        roles: [],
        afterActivate: async (options: OnActivateOptions) => {
          if (options.error) {
            options.router.navigate([ROOT_PATH_MARKER]);
            return false;
          }
          return true;
        },
      }),
    },
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
    title: marker('Sign-up'),
    canActivate: [SsoGuardService],
    data: {
      [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
        roles: [],
        afterActivate: async (options: OnActivateOptions) => {
          if (options.error) {
            options.router.navigate([ROOT_PATH_MARKER]);
            return false;
          }
          return true;
        },
      }),
    },
  },
  {
    path: 'complete-sign-up',
    component: CompleteSignUpComponent,
    title: marker('Complete sign up'),
    canActivate: [SsoCompleteGuardService],
    data: {
      [SSO_COMPLETE_GUARD_DATA_ROUTE_KEY]: new SsoCompleteGuardData({
        type: 'complete-sign-up',

        beforeCompleteSignUp: async (options: CompleteSignUpOptions) => {
          const clientId = options.activatedRouteSnapshot.queryParamMap.get('client_id');
          if (clientId && clientId !== undefined) {
            localStorage.setItem(SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY, clientId);
            options.ssoService.updateHeaders();
          }
          return true;
        },
        afterCompleteSignUp: async (options: CompleteSignUpOptions) => {
          if (options.error) {
            return false;
          }

          const redirectUri = options.activatedRouteSnapshot.queryParamMap.get('redirect_uri');
          if (!redirectUri) {
            if (options.ssoService && options.router) {
              if (searchIn(SsoRoleInterface.admin, options.ssoService.profile$.value?.roles)) {
                options.router.navigate([SECOND_PATH_MARKER]);
              } else {
                options.router.navigate([ROOT_PATH_MARKER]);
              }
            }
          } else {
            location.href = redirectUri;
          }
          return true;
        },
      }),
    },
  },
  {
    path: 'complete-oauth-sign-up',
    component: CompleteSignUpComponent,
    title: marker('Complete OAuth sign up'),
    canActivate: [SsoCompleteGuardService],
    data: {
      [SSO_COMPLETE_GUARD_DATA_ROUTE_KEY]: new SsoCompleteGuardData({
        type: 'complete-oauth-sign-up',

        beforeCompleteSignUp: async (options: CompleteSignUpOptions) => {
          const clientId = options.activatedRouteSnapshot.queryParamMap.get('client_id');
          if (clientId && clientId !== undefined) {
            localStorage.setItem(SSO_ACTIVE_USER_CLIENT_ID_STORAGE_KEY, clientId);
            options.ssoService.updateHeaders();
          }
          return true;
        },
        afterCompleteSignUp: async (options: CompleteSignUpOptions) => {
          if (options.error) {
            return false;
          }

          const redirectUri = options.activatedRouteSnapshot.queryParamMap.get('redirect_uri');
          if (!redirectUri) {
            if (options.ssoService && options.router) {
              if (searchIn(SsoRoleInterface.admin, options.ssoService.profile$.value?.roles)) {
                options.router.navigate([SECOND_PATH_MARKER]);
              } else {
                options.router.navigate([ROOT_PATH_MARKER]);
              }
            }
          } else {
            location.href = redirectUri;
          }
          return true;
        },
      }),
    },
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: marker('Password recovery'),
    canActivate: [SsoGuardService],
    data: {
      [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
        roles: [],
        afterActivate: async (options: OnActivateOptions) => {
          if (options.error) {
            options.router.navigate([ROOT_PATH_MARKER]);
            return false;
          }
          return true;
        },
      }),
    },
  },
  {
    path: 'complete-forgot-password',
    component: CompleteForgotPasswordComponent,
    title: marker('Сomplete forgot password'),
    canActivate: [SsoGuardService, SsoCompleteGuardService],
    data: {
      [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
        roles: [],
        afterActivate: async (options: OnActivateOptions) => {
          if (options.error) {
            options.router.navigate([ROOT_PATH_MARKER]);
            return false;
          }
          return true;
        },
      }),
      [SSO_COMPLETE_GUARD_DATA_ROUTE_KEY]: new SsoCompleteGuardData({
        type: 'complete-forgot-password',
      }),
    },
  },
  {
    path: 'complete-invite',
    component: CompleteInviteComponent,
    title: marker('Completing registration'),
    canActivate: [SsoGuardService, SsoCompleteGuardService],
    data: {
      [SSO_GUARD_DATA_ROUTE_KEY]: new SsoGuardData({
        roles: [],
        afterActivate: async (options: OnActivateOptions) => {
          if (options.error) {
            options.router.navigate([ROOT_PATH_MARKER]);
            return false;
          }
          return true;
        },
      }),
      [SSO_COMPLETE_GUARD_DATA_ROUTE_KEY]: new SsoCompleteGuardData({
        type: 'complete-invite',
      }),
    },
  },
];
