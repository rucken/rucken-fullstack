export interface EngineTokens {
  access_token?: string;
  refresh_token?: string;
}

export interface EngineUser {
  id: string;
  email: string;
  preferredUsername: string;
  givenName?: string | null;
  familyName?: string | null;
  middleName?: string | null;
  nickname?: string | null;
  picture?: string | null;
  gender?: string | null;
  birthdate?: string | null;
  phoneNumber?: string | null;
  roles?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appData?: Record<string, any>;
  lang?: string | null;
  timezone?: number | null;
}

export interface EngineLoginInput {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface EngineSignupInput {
  email?: string;
  password: string;
  confirmPassword: string;
  givenName?: string;
  familyName?: string;
  middleName?: string;
  nickname?: string;
  picture?: string;
  gender?: string;
  birthdate?: string;
  phoneNumber?: string;
  roles?: string[];
  redirectUri?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appData?: Record<string, any>;
}

export interface EngineUserAndTokens {
  tokens?: EngineTokens;
  user?: EngineUser;
}

export interface EngineUpdateProfileInput {
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  middleName?: string;
  nickname?: string;
  gender?: string;
  birthdate?: string;
  phoneNumber?: string;
  picture?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appData?: Record<string, any>;
  lang?: string;
  timezone?: number;
}

export interface EngineCompleteSignUpInput {
  code: string;
}

export interface EngineForgotPasswordInput {
  email: string;
  redirectUri?: string;
}

export interface EngineCompleteForgotPasswordInput {
  code: string;
  password: string;
  confirmPassword: string;
}

export type OAuthProvider = {
  name: string;
  url: string;
};

export interface OAuthVerificationInput {
  verificationCode: string;
  clientId: string | undefined;
}
