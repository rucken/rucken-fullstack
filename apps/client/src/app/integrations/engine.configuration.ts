import { Provider } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FilesService } from '@nestjs-mod/files-afat';
import {
  RuckenRestSdkAngularService,
  EngineUserDtoInterface,
  TokensResponseInterface,
} from '@rucken/rucken-rest-sdk-angular';
import {
  FingerprintService,
  OAuthProvider,
  OAuthVerificationInput,
  ENGINE_CONFIGURATION_TOKEN,
  EngineActiveProjectService,
  EngineCompleteForgotPasswordInput,
  EngineCompleteSignUpInput,
  EngineConfiguration,
  EngineForgotPasswordInput,
  EngineLoginInput,
  EngineSignupInput,
  EngineUpdateProfileInput,
  EngineUser,
  EngineUserAndTokens,
  TokensService,
} from '@rucken/engine-afat';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, map, mergeMap, Observable, of } from 'rxjs';

export class EngineIntegrationConfiguration implements EngineConfiguration {
  constructor(
    private readonly ruckenRestSdkAngularService: RuckenRestSdkAngularService,
    private readonly filesService: FilesService,
    private readonly translocoService: TranslocoService,
    private readonly tokensService: TokensService,
    private readonly engineActiveProjectService: EngineActiveProjectService,
    private readonly fingerprintService: FingerprintService,
    private readonly nzMessageService: NzMessageService,
  ) {}

  getAuthorizationHeaders(): Record<string, string> {
    const lang = this.translocoService.getActiveLang();
    const accessToken = this.tokensService.getAccessToken();
    const activeProjectAuthorizationHeaders = this.engineActiveProjectService.getAuthorizationHeaders();
    if (!accessToken) {
      return {
        'Accept-language': lang,
        ...activeProjectAuthorizationHeaders,
      };
    }
    return {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'Accept-language': lang,
      ...activeProjectAuthorizationHeaders,
    };
  }

  oAuthProviders(): Observable<OAuthProvider[]> {
    return this.ruckenRestSdkAngularService.getEngineApi().engineOAuthControllerOauthProviders();
  }

  oAuthVerification({ verificationCode, clientId }: OAuthVerificationInput): Observable<EngineUserAndTokens> {
    return this.fingerprintService.getFingerprint().pipe(
      mergeMap((fingerprint) =>
        this.ruckenRestSdkAngularService
          .getEngineApi()
          .engineOAuthControllerOauthVerification({
            fingerprint,
            verificationCode,
          })
          .pipe(
            map((result: TokensResponseInterface) => ({
              tokens: this.mapToEngineTokens(result),
              user: this.mapToEngineUser(result.user),
            })),
          ),
      ),
    );
  }

  logout(): Observable<void | null> {
    const refreshToken = this.tokensService.getRefreshToken();
    return this.ruckenRestSdkAngularService
      .getEngineApi()
      .engineControllerSignOut(
        refreshToken
          ? {
              refreshToken,
            }
          : {},
      )
      .pipe(
        map(() => {
          this.tokensService.setTokens({});
        }),
      );
  }

  getProfile(): Observable<EngineUser | undefined> {
    return this.ruckenRestSdkAngularService
      .getEngineApi()
      .engineControllerProfile()
      .pipe(
        map((result) => {
          return this.mapToEngineUser(result);
        }),
      );
  }

  private mapToEngineTokens(tokens: TokensResponseInterface) {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  private mapToEngineUser(result: EngineUserDtoInterface): {
    phoneNumber: string | null;
    email: string;
    id: string;
    preferredUsername: string;
    roles: string[];
    picture: string | null;
    timezone: number | null;
  } {
    return {
      phoneNumber: result.phone,
      email: result.email,
      id: result.id,
      preferredUsername: result.username || '',
      roles: result.roles ? result.roles.split(',') : [],
      picture: result.picture,
      timezone: result.timezone,
    };
  }

  updateProfile(data: EngineUpdateProfileInput): Observable<void | null> {
    const oldData = data;
    return (data.picture ? this.filesService.getPresignedUrlAndUploadFile(data.picture) : of('')).pipe(
      catchError((err) => {
        console.error(err);
        this.nzMessageService.error(this.translocoService.translate('Error while saving image'));
        return of(undefined);
      }),
      mergeMap((picture) => {
        return this.ruckenRestSdkAngularService.getEngineApi().engineControllerUpdateProfile({
          birthdate: data.birthdate,
          firstname: data.givenName,
          gender: data.gender,
          lastname: data.familyName,
          picture,
          password: data.newPassword,
          confirmPassword: data.confirmNewPassword,
          oldPassword: data.oldPassword,
          timezone: data.timezone,
        });
      }),
      mergeMap(() => this.ruckenRestSdkAngularService.getEngineApi().engineControllerProfile()),
      mergeMap((newData) => {
        if (
          oldData?.picture &&
          typeof oldData?.picture === 'string' &&
          (newData as EngineUpdateProfileInput)?.picture !== oldData.picture
        ) {
          return this.filesService.deleteFile(oldData.picture).pipe(map(() => newData));
        }
        return of(newData);
      }),
      map(() => null),
    );
  }

  refreshToken(): Observable<EngineUserAndTokens | undefined> {
    const refreshToken = this.tokensService.getRefreshToken();
    return this.fingerprintService.getFingerprint().pipe(
      mergeMap((fingerprint) =>
        this.ruckenRestSdkAngularService
          .getEngineApi()
          .engineControllerRefreshTokens({
            ...(refreshToken
              ? {
                  refreshToken,
                }
              : {}),
            fingerprint,
          })
          .pipe(
            map((result: TokensResponseInterface) => ({
              tokens: this.mapToEngineTokens(result),
              user: this.mapToEngineUser(result.user),
            })),
          ),
      ),
    );
  }

  signup(data: EngineSignupInput): Observable<EngineUserAndTokens> {
    const { confirmPassword, password, email, nickname } = data;
    if (!email) {
      throw new Error('email not set');
    }
    if (!confirmPassword) {
      throw new Error('confirmPassword not set');
    }
    if (!password) {
      throw new Error('password not set');
    }
    return this.fingerprintService.getFingerprint().pipe(
      mergeMap((fingerprint) =>
        this.ruckenRestSdkAngularService
          .getEngineApi()
          .engineControllerSignUp({
            email,
            fingerprint,
            password,
            username: nickname,
            confirmPassword: confirmPassword,
          })
          .pipe(
            map((result) => ({
              tokens: this.mapToEngineTokens(result),
              user: this.mapToEngineUser(result.user),
            })),
          ),
      ),
    );
  }

  login(data: EngineLoginInput): Observable<EngineUserAndTokens> {
    const { password, email } = data;
    if (!email) {
      throw new Error('email not set');
    }
    return this.fingerprintService.getFingerprint().pipe(
      mergeMap((fingerprint) =>
        this.ruckenRestSdkAngularService
          .getEngineApi()
          .engineControllerSignIn({
            email,
            fingerprint,
            password,
          })
          .pipe(
            map((result) => ({
              tokens: this.mapToEngineTokens(result),
              user: this.mapToEngineUser(result.user),
            })),
          ),
      ),
    );
  }

  completeSignUp(data: EngineCompleteSignUpInput): Observable<EngineUserAndTokens> {
    const { code } = data;
    if (!code) {
      throw new Error('code not set');
    }
    return this.fingerprintService.getFingerprint().pipe(
      mergeMap((fingerprint) =>
        this.ruckenRestSdkAngularService
          .getEngineApi()
          .engineControllerCompleteSignUp({
            code,
            fingerprint,
          })
          .pipe(
            map((result) => ({
              tokens: this.mapToEngineTokens(result),
              user: this.mapToEngineUser(result.user),
            })),
          ),
      ),
    );
  }

  completeForgotPassword(data: EngineCompleteForgotPasswordInput): Observable<EngineUserAndTokens> {
    const { password, confirmPassword: confirmPassword, code } = data;
    if (!password) {
      throw new Error('password not set');
    }
    if (!confirmPassword) {
      throw new Error('confirmPassword not set');
    }
    if (!code) {
      throw new Error('code not set');
    }
    return this.fingerprintService.getFingerprint().pipe(
      mergeMap((fingerprint) =>
        this.ruckenRestSdkAngularService
          .getEngineApi()
          .engineControllerCompleteForgotPassword({
            password,
            confirmPassword,
            code,
            fingerprint,
          })
          .pipe(
            map((result) => ({
              tokens: this.mapToEngineTokens(result),
              user: this.mapToEngineUser(result.user),
            })),
          ),
      ),
    );
  }

  forgotPassword(data: EngineForgotPasswordInput): Observable<true> {
    const { email, redirectUri: redirectUri } = data;
    if (!email) {
      throw new Error('email not set');
    }
    return this.ruckenRestSdkAngularService
      .getEngineApi()
      .engineControllerForgotPassword({
        email,
        redirectUri,
      })
      .pipe(map(() => true));
  }
}

export function provideEngineConfiguration(): Provider {
  return {
    provide: ENGINE_CONFIGURATION_TOKEN,
    useClass: EngineIntegrationConfiguration,
    deps: [
      RuckenRestSdkAngularService,
      FilesService,
      TranslocoService,
      TokensService,
      EngineActiveProjectService,
      FingerprintService,
      NzMessageService,
    ],
  };
}
