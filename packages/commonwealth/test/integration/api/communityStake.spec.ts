import { dispose } from '@hicommonwealth/core';
import { commonProtocol, type UserInstance } from '@hicommonwealth/model';
import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import { buildUser } from '../../unit/unitHelpers';
import { get, post } from '../../util/httpUtils';

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
  let server: TestServer;

  beforeAll(async () => {
    server = await testServer(import.meta);
  });

  afterAll(async () => {
    await dispose()();
  });

  test('The handler creates and updates community stake', async () => {
    // @ts-expect-error StrictNullChecks
    const controller = new ServerCommunitiesController(server.models, null);
    const user: UserInstance = buildUser({
      models: server.models,
      userAttributes: { email: '', id: 1, isAdmin: true, profile: {} },
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

  test('The community stake routes work correctly', async () => {
    const stake_id = 3;
    const jwtToken = jwt.sign(
      { id: 2, email: server.e2eTestEntities.testUsers[0].email },
      config.AUTH.JWT_SECRET,
    );

    const actualPutResponse = (
      await post(
        `/api/communityStakes/${baseRequest.community_id}/${stake_id}`,
        { ...baseRequest, stake_id, jwt: jwtToken },
        true,
        server.app,
      )
    ).result;

    assert.equal(
      actualPutResponse.community_id,
      expectedCreateResp.community_id,
    );
    assert.equal(actualPutResponse.stake_id, stake_id);
    assert.equal(actualPutResponse.stake_token, expectedCreateResp.stake_token);
    assert.equal(actualPutResponse.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(
      actualPutResponse.stake_enabled,
      expectedCreateResp.stake_enabled,
    );

    const actualGetResponse = (
      await get(
        `/api/communityStakes/${baseRequest.community_id}/${stake_id}`,
        // @ts-expect-error StrictNullChecks
        null,
        true,
        server.app,
      )
    ).result;

    assert.equal(
      actualGetResponse.community_id,
      expectedCreateResp.community_id,
    );
    assert.equal(actualGetResponse.stake_id, stake_id);
    assert.equal(actualGetResponse.stake_token, expectedCreateResp.stake_token);
    assert.equal(actualGetResponse.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(
      actualGetResponse.stake_enabled,
      expectedCreateResp.stake_enabled,
    );
  });

  test('The integration with protocol works', async () => {
    const community = await server.models.Community.findOne({
      where: {
        id: 'common-protocol',
      },
    });
    assert.isNotNull(community);
    await commonProtocol.communityStakeConfigValidator.validateCommunityStakeConfig(
      community!,
      2,
    );
  });
});
