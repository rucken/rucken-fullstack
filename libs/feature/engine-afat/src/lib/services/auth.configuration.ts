/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectionToken } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import {
  OAuthProvider,
  OAuthVerificationInput,
  EngineCompleteForgotPasswordInput,
  EngineCompleteSignUpInput,
  EngineForgotPasswordInput,
  EngineLoginInput,
  EngineSignupInput,
  EngineUpdateProfileInput,
  EngineUser,
  EngineUserAndTokens,
} from './auth.types';

export type AfterUpdateProfileEvent = {
  old?: EngineUser;
  new?: EngineUser;
};

export class EngineConfiguration {
  constructor(options?: EngineConfiguration) {
    Object.assign(this, options);
  }
  // todo: remove not need options
  logout(): Observable<void | null> {
    return throwError(() => new Error('not implemented'));
  }
  getProfile(): Observable<EngineUser | undefined> {
    return throwError(() => new Error('not implemented'));
  }
  refreshToken(): Observable<EngineUserAndTokens | undefined> {
    return throwError(() => new Error('not implemented'));
  }
  signup(data: EngineSignupInput): Observable<EngineUserAndTokens> {
    return throwError(() => new Error('not implemented'));
  }
  login(data: EngineLoginInput): Observable<EngineUserAndTokens> {
    return throwError(() => new Error('not implemented'));
  }
  updateProfile(data: EngineUpdateProfileInput): Observable<void | null> {
    return throwError(() => new Error('not implemented'));
  }
  completeSignUp(data: EngineCompleteSignUpInput): Observable<EngineUserAndTokens> {
    return throwError(() => new Error('not implemented'));
  }
  forgotPassword(data: EngineForgotPasswordInput): Observable<true> {
    return throwError(() => new Error('not implemented'));
  }
  completeForgotPassword(data: EngineCompleteForgotPasswordInput): Observable<EngineUserAndTokens> {
    return throwError(() => new Error('not implemented'));
  }
  getAuthorizationHeaders(): Record<string, string> {
    throw new Error('not implemented');
  }
  oAuthProviders(): Observable<OAuthProvider[]> {
    return throwError(() => new Error('not implemented'));
  }
  oAuthVerification({ verificationCode, clientId }: OAuthVerificationInput): Observable<EngineUserAndTokens> {
    return throwError(() => new Error('not implemented'));
  }
}

export const ENGINE_CONFIGURATION_TOKEN = new InjectionToken<string>('ENGINE_CONFIGURATION_TOKEN');
