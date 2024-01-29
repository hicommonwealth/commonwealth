import { models, UserInstance } from '@hicommonwealth/model';
import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import { validateCommunityStakeConfig } from '../../../server/util/commonProtocol/communityStakeConfigValidator';
import { buildUser } from '../../unit/unitHelpers';
import { resetDatabase } from '../../util/resetDatabase';
import { get, put } from './external/appHook.spec';
import { testUsers } from './external/dbEntityHooks.spec';

chai.use(chaiHttp);
chai.should();

const baseRequest = {
  community_id: 'common-protocol',
  stake_id: 2,
  stake_token: '',
  vote_weight: 1,
  stake_enabled: true,
};

const expectedCreateResp = {
  community_id: baseRequest.community_id,
  stake_id: baseRequest.stake_id,
  stake_token: baseRequest.stake_token,
  vote_weight: baseRequest.vote_weight,
  stake_enabled: baseRequest.stake_enabled,
};

describe('PUT communityStakes Tests', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('The handler creates and updates community stake', async () => {
    const controller = new ServerCommunitiesController(models, null, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;

    const createResponse = await controller.putCommunityStake({
      communityStake: baseRequest,
      user: user,
    });
    assert.equal(createResponse.community_id, expectedCreateResp.community_id);
    assert.equal(createResponse.stake_id, expectedCreateResp.stake_id);
    assert.equal(createResponse.stake_token, expectedCreateResp.stake_token);
    assert.equal(createResponse.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(
      createResponse.stake_enabled,
      expectedCreateResp.stake_enabled,
    );

    const updateResp = await controller.putCommunityStake({
      communityStake: { ...baseRequest, stake_token: 'temp' },
      user: user,
    });

    const expectedUpdateResp = {
      community_id: baseRequest.community_id,
      stake_id: baseRequest.stake_id,
      stake_token: 'temp',
      vote_weight: baseRequest.vote_weight,
      stake_enabled: baseRequest.stake_enabled,
    };

    assert.equal(updateResp.community_id, expectedUpdateResp.community_id);
    assert.equal(updateResp.stake_id, expectedUpdateResp.stake_id);
    assert.equal(updateResp.stake_token, expectedUpdateResp.stake_token);
    assert.equal(updateResp.vote_weight, expectedUpdateResp.vote_weight);
    assert.equal(updateResp.stake_enabled, expectedUpdateResp.stake_enabled);

    const getResp = await controller.getCommunityStake({
      community_id: baseRequest.community_id,
      stake_id: baseRequest.stake_id,
    });

    assert.equal(getResp.community_id, expectedUpdateResp.community_id);
    assert.equal(getResp.stake_id, expectedUpdateResp.stake_id);
    assert.equal(getResp.stake_token, expectedUpdateResp.stake_token);
    assert.equal(getResp.vote_weight, expectedUpdateResp.vote_weight);
    assert.equal(getResp.stake_enabled, expectedUpdateResp.stake_enabled);
    assert.equal(getResp.Chain.namespace, 'IanSpace');
  });

  it('The community stake routes work correctly', async () => {
    const jwtToken = jwt.sign({ id: 2, email: testUsers[0].email }, JWT_SECRET);

    const actualPutResponse = (
      await put(
        `/api/communityStakes/${baseRequest.community_id}/${baseRequest.stake_id}`,
        { ...baseRequest, jwt: jwtToken },
        true,
        app,
      )
    ).result;

    assert.equal(
      actualPutResponse.community_id,
      expectedCreateResp.community_id,
    );
    assert.equal(actualPutResponse.stake_id, expectedCreateResp.stake_id);
    assert.equal(actualPutResponse.stake_token, expectedCreateResp.stake_token);
    assert.equal(actualPutResponse.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(
      actualPutResponse.stake_enabled,
      expectedCreateResp.stake_enabled,
    );

    const actualGetResponse = (
      await get(
        `/api/communityStakes/${baseRequest.community_id}/${baseRequest.stake_id}`,
        null,
        true,
        app,
      )
    ).result;

    assert.equal(
      actualGetResponse.community_id,
      expectedCreateResp.community_id,
    );
    assert.equal(actualGetResponse.stake_id, expectedCreateResp.stake_id);
    assert.equal(actualGetResponse.stake_token, expectedCreateResp.stake_token);
    assert.equal(actualGetResponse.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(
      actualGetResponse.stake_enabled,
      expectedCreateResp.stake_enabled,
    );
  });

  it('The integration with protocol works', async () => {
    await validateCommunityStakeConfig(models, 'common-protocol', 2);
  });
});
