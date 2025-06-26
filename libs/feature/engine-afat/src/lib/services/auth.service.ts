import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, mergeMap, Observable, of, Subject } from 'rxjs';
import { ENGINE_CONFIGURATION_TOKEN, EngineConfiguration } from './auth.configuration';
import {
  EngineCompleteForgotPasswordInput,
  EngineCompleteSignUpInput,
  EngineForgotPasswordInput,
  EngineLoginInput,
  EngineSignupInput,
  EngineUpdateProfileInput,
  EngineUser,
  EngineUserAndTokens,
  OAuthVerificationInput,
} from './auth.types';
import { TokensService } from './tokens.service';

@Injectable({ providedIn: 'root' })
export class EngineService {
  profile$ = new BehaviorSubject<EngineUser | undefined>(undefined);
  updateHeaders$ = new Subject<boolean>();

  constructor(
    protected readonly tokensService: TokensService,
    @Inject(ENGINE_CONFIGURATION_TOKEN)
    protected readonly engineConfiguration: EngineConfiguration,
  ) {}

  updateHeaders() {
    this.updateHeaders$.next(true);
  }

  completeSignUp(data: EngineCompleteSignUpInput): Observable<EngineUserAndTokens | null> {
    return this.engineConfiguration.completeSignUp
      ? this.engineConfiguration.completeSignUp(data).pipe(
          mergeMap((result) => {
            return this.setProfileAndTokens(result).pipe(
              map((profile) => ({
                profile,
                tokens: result.tokens,
              })),
            );
          }),
        )
      : of(null);
  }

  forgotPassword(data: EngineForgotPasswordInput): Observable<true | null> {
    return this.engineConfiguration.forgotPassword ? this.engineConfiguration.forgotPassword(data) : of(null);
  }

  completeForgotPassword(data: EngineCompleteForgotPasswordInput): Observable<EngineUserAndTokens | null> {
    return this.engineConfiguration.completeForgotPassword
      ? this.engineConfiguration.completeForgotPassword(data).pipe(
          mergeMap((result) => {
            return this.setProfileAndTokens(result).pipe(
              map((profile) => ({
                profile,
                tokens: result.tokens,
              })),
            );
          }),
        )
      : of(null);
  }

  getAuthorizationHeaders() {
    return this.engineConfiguration.getAuthorizationHeaders
      ? this.engineConfiguration.getAuthorizationHeaders()
      : undefined;
  }

  signUp(data: EngineSignupInput) {
    return this.engineConfiguration
      .signup({
        ...data,
        email: data.email?.toLowerCase(),
      })
      .pipe(
        mergeMap((result) => {
          return this.setProfileAndTokens(result).pipe(
            map((profile) => ({
              profile,
              tokens: result.tokens,
            })),
          );
        }),
      );
  }

  updateProfile(data: EngineUpdateProfileInput) {
    return this.engineConfiguration.updateProfile(data).pipe(
      mergeMap(() => this.engineConfiguration.getProfile()),
      mergeMap((result) => this.setProfile(result)),
    );
  }

  signIn(data: EngineLoginInput) {
    return this.engineConfiguration
      .login({
        ...data,
        email: data.email?.toLowerCase(),
      })
      .pipe(
        mergeMap((result) => {
          return this.setProfileAndTokens(result).pipe(
            map((profile) => ({
              profile,
              tokens: result.tokens,
            })),
          );
        }),
      );
  }

  signOut() {
    return this.engineConfiguration.logout().pipe(
      mergeMap(() => {
        return this.clearProfileAndTokens();
      }),
      catchError((err) => {
        console.error(err);
        return this.clearProfileAndTokens();
      }),
    );
  }

  refreshToken() {
    return this.engineConfiguration.refreshToken().pipe(
      mergeMap((result) => {
        return this.setProfileAndTokens(result);
      }),
      catchError((err) => {
        console.error(err);
        return this.clearProfileAndTokens();
      }),
    );
  }

  clearProfileAndTokens() {
    return this.setProfileAndTokens({} as EngineUserAndTokens);
  }

  setProfileAndTokens(result: EngineUserAndTokens | undefined) {
    this.tokensService.setTokens(result?.tokens);
    return this.setProfile(result?.user);
  }

  setProfile(result: EngineUser | undefined) {
    this.profile$.next(result);
    return of(result);
  }

  getOAuthProviders() {
    return this.engineConfiguration.oAuthProviders();
  }

  oAuthVerification(oAuthVerificationInput: OAuthVerificationInput) {
    return this.engineConfiguration.oAuthVerification(oAuthVerificationInput);
  }
}
