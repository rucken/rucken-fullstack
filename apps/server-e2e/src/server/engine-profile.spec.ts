import { TokensResponse } from '@rucken/rucken-rest-sdk';
import { RuckenRestClientHelper } from '@rucken/testing';

describe('Engine profile (e2e)', () => {
  let user: RuckenRestClientHelper<'strict'>;
  let project: RuckenRestClientHelper<'strict'>;

  let userTokens: TokensResponse;

  jest.setTimeout(5 * 60 * 1000);

  beforeAll(async () => {
    user = await new RuckenRestClientHelper({
      headers: {
        'x-skip-throttle': process.env.RUCKEN_ENGINE_ADMIN_SECRET,
      },
    }).generateRandomUser();
    project = await new RuckenRestClientHelper({
      headers: {
        'x-skip-throttle': process.env.RUCKEN_ENGINE_ADMIN_SECRET,
      },
    }).generateRandomUser();
  });

  it('Create project', async () => {
    const { data: createOneResult } = await user.getEngineApi().engineProjectsControllerCreateOne(
      {
        public: false,
        name: project.randomUser.uniqId,
        clientId: project.randomUser.id,
        clientSecret: project.randomUser.password,
      },
      {
        headers: {
          'x-admin-secret': process.env.RUCKEN_ENGINE_ADMIN_SECRET,
        },
      },
    );
    expect(createOneResult).toHaveProperty('id');
  });

  it('Sign-up', async () => {
    const { data: signUpResult } = await user.getEngineApi().engineControllerSignUp(
      {
        username: user.randomUser.username,
        email: user.randomUser.email,
        password: user.randomUser.password,
        confirmPassword: user.randomUser.password,
        fingerprint: user.randomUser.id,
      },
      {
        headers: {
          'x-client-id': project.randomUser.id,
        },
      },
    );
    expect(signUpResult).toHaveProperty('accessToken');
    expect(signUpResult).toHaveProperty('refreshToken');
    expect(signUpResult).toHaveProperty('user');
  });

  it('As admin set current date to emailVerifiedAt column', async () => {
    const { data: findManyProjectsResult } = await user
      .getEngineApi()
      .engineProjectsControllerFindMany(undefined, undefined, project.randomUser.id, undefined, {
        headers: {
          'x-admin-secret': process.env.RUCKEN_ENGINE_ADMIN_SECRET,
        },
      });

    const { data: findManyResult } = await user
      .getEngineApi()
      .engineUsersControllerFindMany(
        undefined,
        undefined,
        user.randomUser.email,
        undefined,
        findManyProjectsResult.engineProjects[0].id,
        {
          headers: {
            'x-admin-secret': process.env.RUCKEN_ENGINE_ADMIN_SECRET,
          },
        },
      );

    expect(findManyResult.engineUsers).toHaveLength(1);

    const { data: updateOneResult } = await user.getEngineApi().engineUsersControllerUpdateOne(
      findManyResult.engineUsers[0].id,
      {
        emailVerifiedAt: new Date().toISOString(),
      },
      {
        headers: {
          'x-admin-secret': process.env.RUCKEN_ENGINE_ADMIN_SECRET,
        },
      },
    );

    expect(updateOneResult.emailVerifiedAt).not.toBeNull();
  });

  it('Sign-in', async () => {
    const { data: signInResult } = await user.getEngineApi().engineControllerSignIn(
      {
        email: user.randomUser.email,
        password: user.randomUser.password,
        fingerprint: user.randomUser.id,
      },
      {
        headers: {
          'x-client-id': project.randomUser.id,
        },
      },
    );
    expect(signInResult).toHaveProperty('accessToken');
    expect(signInResult).toHaveProperty('refreshToken');
    expect(signInResult).toHaveProperty('user');
    userTokens = signInResult;
  });

  it('Update user profile data', async () => {
    const { data: profileResult } = await user.getEngineApi().engineControllerProfile({
      headers: {
        ...(userTokens.accessToken ? { Authorization: `Bearer ${userTokens.accessToken}` } : {}),
        'x-client-id': project.randomUser.id,
      },
    });
    const { data: updatedProfileResult } = await user.getEngineApi().engineControllerUpdateProfile(
      {
        firstname: user.randomUser.firstName,
        birthdate: user.randomUser.dateOfBirth.toISOString(),
        gender: 'm',
        lastname: user.randomUser.lastName,
        picture: 'pic',
      },
      {
        headers: {
          ...(userTokens.accessToken ? { Authorization: `Bearer ${userTokens.accessToken}` } : {}),
          'x-client-id': project.randomUser.id,
        },
      },
    );
    expect(profileResult).toMatchObject({
      email: user.randomUser.email,
      phone: null,
      username: user.randomUser.username,
      roles: 'user',
      firstname: null,
      lastname: null,
      gender: null,
      birthdate: null,
      picture: null,
      appData: null,
      revokedAt: null,
      // emailVerifiedAt: '2025-02-26T06:57:00.949Z',
      phoneVerifiedAt: null,
      // createdAt: '2025-02-26T06:57:00.930Z',
      // updatedAt: '2025-02-26T06:57:00.953Z',
    });
    expect(profileResult.emailVerifiedAt).toBeDefined();
    expect(profileResult.createdAt).toBeDefined();
    expect(profileResult.updatedAt).toBeDefined();
    expect(profileResult.createdAt).not.toEqual(profileResult.updatedAt);

    expect(updatedProfileResult).toMatchObject({
      id: profileResult.id,
      email: user.randomUser.email,
      phone: null,
      username: user.randomUser.username,
      roles: 'user',
      firstname: user.randomUser.firstName,
      lastname: user.randomUser.lastName,
      gender: 'm',
      birthdate: user.randomUser.dateOfBirth.toISOString(),
      picture: 'pic',
      appData: null,
      revokedAt: null,
      emailVerifiedAt: profileResult.emailVerifiedAt,
      phoneVerifiedAt: null,
      createdAt: profileResult.createdAt,
      // updatedAt: '2025-02-26T06:57:00.953Z',
    });
    expect(updatedProfileResult.updatedAt).toBeDefined();
    expect(profileResult.updatedAt).not.toEqual(updatedProfileResult.updatedAt);
  });
});
