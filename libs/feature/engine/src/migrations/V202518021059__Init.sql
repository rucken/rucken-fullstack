CREATE TABLE IF NOT EXISTS "EngineProject"(
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" varchar(255) NOT NULL,
    "nameLocale" jsonb,
    "clientId" varchar(100) NOT NULL,
    "clientSecret" varchar(255) NOT NULL,
    "public" boolean NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    ALTER TABLE "EngineProject"
        ADD CONSTRAINT "PK_ENGINE_PROJECTS" PRIMARY KEY(id);
EXCEPTION
    WHEN invalid_table_definition THEN
        NULL;
END
$$;

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_PROJECTS__PUBLIC" ON "EngineProject"("public");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_PROJECTS__CLIENT_ID" ON "EngineProject"("clientId");

--
CREATE TABLE IF NOT EXISTS "EngineUser"(
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    email varchar(255) NOT NULL,
    phone varchar(255),
    username varchar(255),
    password varchar(255) NOT NULL,
    "roles" varchar(255),
    "firstname" varchar(255),
    "lastname" varchar(255),
    "gender" varchar(1),
    "birthdate" timestamp,
    "picture" text,
    "appData" jsonb,
    "revokedAt" timestamp,
    "emailVerifiedAt" timestamp,
    "phoneVerifiedAt" timestamp,
    "timezone" double precision,
    "lang" varchar(2),
    "projectId" uuid NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    ALTER TABLE "EngineUser"
        ADD CONSTRAINT "PK_ENGINE_USERS" PRIMARY KEY(id);
EXCEPTION
    WHEN invalid_table_definition THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineUser"
        ADD CONSTRAINT "FK_ENGINE_USERS__PROJECT_ID" FOREIGN KEY("projectId") REFERENCES "EngineProject";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_USERS__PROJECT_ID" ON "EngineUser"("projectId");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_USERS__EMAIL" ON "EngineUser"(email, "projectId");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_USERS__USERNAME" ON "EngineUser"(username, "projectId");

--
CREATE TABLE IF NOT EXISTS "EngineRefreshSession"(
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "refreshToken" uuid NOT NULL,
    "userAgent" varchar(255),
    "fingerprint" varchar(255),
    "userIp" varchar(128),
    "expiresAt" timestamp,
    "userData" jsonb,
    "enabled" boolean NOT NULL,
    "userId" uuid NOT NULL,
    "projectId" uuid NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    ALTER TABLE "EngineRefreshSession"
        ADD CONSTRAINT "PK_ENGINE_REFRESH_SESSIONS" PRIMARY KEY(id);
EXCEPTION
    WHEN invalid_table_definition THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineRefreshSession"
        ADD CONSTRAINT "FK_ENGINE_REFRESH_SESSIONS__PROJECT_ID" FOREIGN KEY("projectId") REFERENCES "EngineProject";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineRefreshSession"
        ADD CONSTRAINT "FK_ENGINE_REFRESH_SESSIONS__USER_ID" FOREIGN KEY("userId") REFERENCES "EngineUser";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_REFRESH_SESSIONS" ON "EngineRefreshSession"("userId", "fingerprint", "projectId")
WHERE
    enabled = TRUE;

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_REFRESH_SESSIONS__PROJECT_ID" ON "EngineRefreshSession"("projectId");

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_REFRESH_SESSIONS_USER_ID" ON "EngineRefreshSession"("userId", "projectId");

--
CREATE TABLE IF NOT EXISTS "EngineEmailTemplate"(
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "subject" text NOT NULL,
    "subjectLocale" jsonb,
    "text" text NOT NULL,
    "textLocale" jsonb,
    "html" text NOT NULL,
    "htmlLocale" jsonb,
    "operationName" varchar(128),
    "projectId" uuid NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    ALTER TABLE "EngineEmailTemplate"
        ADD CONSTRAINT "PK_ENGINE_EMAIL_TEMPLATES" PRIMARY KEY(id);
EXCEPTION
    WHEN invalid_table_definition THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineEmailTemplate"
        ADD CONSTRAINT "FK_ENGINE_EMAIL_TEMPLATES__PROJECT_ID" FOREIGN KEY("projectId") REFERENCES "EngineProject";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_EMAIL_TEMPLATES__PROJECT_ID" ON "EngineEmailTemplate"("projectId");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_EMAIL_TEMPLATES__OPERATION_NAME" ON "EngineEmailTemplate"("projectId", "operationName");

--
CREATE TABLE IF NOT EXISTS "EngineOAuthProvider"(
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" varchar(255) NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    ALTER TABLE "EngineOAuthProvider"
        ADD CONSTRAINT "PK_ENGINE_OAUTH_PROVIDER" PRIMARY KEY(id);
EXCEPTION
    WHEN invalid_table_definition THEN
        NULL;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_OAUTH_PROVIDER__NAME" ON "EngineOAuthProvider"("name");

--
CREATE TABLE IF NOT EXISTS "EngineOAuthProviderSettings"(
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" varchar(255) NOT NULL,
    "value" text NOT NULL,
    "providerId" uuid NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    ALTER TABLE "EngineOAuthProviderSettings"
        ADD CONSTRAINT "PK_ENGINE_OAUTH_PROVIDER_SETTINGS" PRIMARY KEY(id);
EXCEPTION
    WHEN invalid_table_definition THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineOAuthProviderSettings"
        ADD CONSTRAINT "FK_ENGINE_OAUTH_PROVIDER_SETTINGS__PROVIDER_ID" FOREIGN KEY("providerId") REFERENCES "EngineOAuthProvider";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_OAUTH_PROVIDER_SETTINGS__PROVIDER_ID" ON "EngineOAuthProviderSettings"("providerId");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_OAUTH_PROVIDER_SETTINGS__NAME" ON "EngineOAuthProviderSettings"("providerId", "name");

--
CREATE TABLE IF NOT EXISTS "EngineOAuthToken"(
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "grantedAt" timestamp DEFAULT now() NOT NULL,
    "accessToken" varchar(512) NOT NULL,
    "refreshToken" varchar(512),
    "expiresAt" timestamp,
    "tokenType" varchar(255),
    "scope" varchar(512),
    "verificationCode" varchar(512),
    "userId" uuid NOT NULL,
    "projectId" uuid NOT NULL,
    "providerId" uuid NOT NULL,
    "providerUserId" varchar(512) NOT NULL,
    "providerUserData" jsonb,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    ALTER TABLE "EngineOAuthToken"
        ADD CONSTRAINT "PK_ENGINE_OAUTH_TOKENS_SETTINGS" PRIMARY KEY(id);
EXCEPTION
    WHEN invalid_table_definition THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineOAuthToken"
        ADD CONSTRAINT "FK_ENGINE_OAUTH_TOKENS__USER_ID" FOREIGN KEY("userId") REFERENCES "EngineUser";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineOAuthToken"
        ADD CONSTRAINT "FK_ENGINE_OAUTH_TOKENS__PROJECT_ID" FOREIGN KEY("projectId") REFERENCES "EngineProject";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "EngineOAuthToken"
        ADD CONSTRAINT "FK_ENGINE_OAUTH_TOKENS__PROVIDER_ID" FOREIGN KEY("providerId") REFERENCES "EngineOAuthProvider";
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_OAUTH_TOKENS__USER_ID" ON "EngineOAuthToken"("userId");

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_OAUTH_TOKENS__PROJECT_ID" ON "EngineOAuthToken"("projectId");

CREATE INDEX IF NOT EXISTS "IDX_ENGINE_OAUTH_TOKENS__PROVIDER_ID" ON "EngineOAuthToken"("providerId");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ENGINE_OAUTH_TOKENS__NAME" ON "EngineOAuthToken"("providerId", "projectId", "userId", "accessToken");

