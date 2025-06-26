import { RuckenRestClientHelper } from '@rucken/testing';
describe('OAuth (e2e)', () => {
  jest.setTimeout(60000);

  let user: RuckenRestClientHelper<'strict'>;

  beforeAll(async () => {
    user = await new RuckenRestClientHelper({
      headers: {
        'x-skip-throttle': process.env.RUCKEN_ENGINE_ADMIN_SECRET,
      },
    }).generateRandomUser();
  });

  it('Get providers', async () => {
    const { data } = await user.getSsoApi().ssoOAuthControllerOauthProviders();
    expect(data.length).toBeGreaterThan(0);
    expect(data.find((p) => p.name === 'google')?.name).toEqual('google');
  });
});
