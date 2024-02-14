import {
  UserInstance,
  commonProtocol,
  models,
  tester,
} from '@hicommonwealth/model';
import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import { buildUser } from '../../unit/unitHelpers';
import { get, post } from './external/appHook.spec';
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

describe('POST communityStakes Tests', () => {
  beforeEach(async () => {
    await tester.seedDb();
  });

  it('The handler creates and updates community stake', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;

    const createResponse = await controller.createCommunityStake({
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

    let error;
    try {
      // try to change vote weight
      await controller.createCommunityStake({
        communityStake: { ...baseRequest, vote_weight: 20 },
        user: user,
      });
    } catch (e) {
      error = e;
    }

    assert.equal(error.message, 'Community stake already exists');

    await controller.getCommunityStake({
      community_id: baseRequest.community_id,
      stake_id: baseRequest.stake_id,
    });

    assert.equal(createResponse.community_id, expectedCreateResp.community_id);
    assert.equal(createResponse.stake_id, expectedCreateResp.stake_id);
    assert.equal(createResponse.stake_token, expectedCreateResp.stake_token);
    assert.equal(createResponse.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(
      createResponse.stake_enabled,
      expectedCreateResp.stake_enabled,
    );
  });

  it('The community stake routes work correctly', async () => {
    const jwtToken = jwt.sign({ id: 2, email: testUsers[0].email }, JWT_SECRET);

    const actualPutResponse = (
      await post(
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
    const community = await models.Community.findOne({
      where: {
        id: 'common-protocol',
      },
      include: [
        {
          model: models.ChainNode,
          attributes: ['eth_chain_id', 'url'],
        },
      ],
      attributes: ['namespace'],
    });
    await commonProtocol.communityStakeConfigValidator.validateCommunityStakeConfig(
      community,
      2,
    );
  });
});
