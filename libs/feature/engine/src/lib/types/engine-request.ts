import { EngineProject } from '../generated/rest/dto/engine-project.entity';
import { EngineUser } from '../generated/rest/dto/engine-user.entity';

export type EngineAccessTokenData = {
  userId: string;
  projectId: string;
  roles?: string;
  refreshToken: string;
};

export type EngineRequest = {
  engineProject: EngineProject;
  engineUser?: EngineUser;
  engineClientId?: string;
  engineClientSecret?: string;
  engineAccessTokenData?: EngineAccessTokenData;
  skipEmptyEngineUser?: boolean;
  skipThrottle?: boolean;
  headers: Record<string, string>;
};
