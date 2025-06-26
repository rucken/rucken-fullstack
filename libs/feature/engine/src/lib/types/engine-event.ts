import { EngineOAuthVerificationArgs } from './engine-oauth-verification.dto';
import { SignInArgs } from './sign-in.dto';
import { SignOutArgs } from './sign-out.dto';
import { CompleteSignUpArgs, SignUpArgs } from './sign-up.dto';

export enum EngineEventEnum {
  SignIn = 'SignIn',
  SignUp = 'SignUp',
  SignOut = 'SignOut',
  CompleteSignUp = 'CompleteSignUp',
  OAuthVerification = 'OAuthVerification',
}

export interface EngineEventContext {
  [EngineEventEnum.OAuthVerification]: {
    oAuthVerificationArgs: EngineOAuthVerificationArgs;
  };
  [EngineEventEnum.SignIn]: {
    signInArgs: SignInArgs;
  };
  [EngineEventEnum.SignUp]: {
    signUpArgs: SignUpArgs;
  };
  [EngineEventEnum.SignOut]: {
    signOutArgs: SignOutArgs;
  };
  [EngineEventEnum.CompleteSignUp]: {
    completeSignUpArgs: CompleteSignUpArgs;
  };
  serviceId: string;
  userId: string;
  projectId: string;
  userIp: string;
  userAgent: string;
}
